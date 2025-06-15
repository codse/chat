import { Id } from '@convex/_generated/dataModel';
import { internalMutation, MutationCtx } from '@convex/_generated/server';
import { tryCatch } from '@convex/utils';
import { Result, err, ok } from 'neverthrow';

async function getChatsPendingDeletion(
  ctx: MutationCtx,
  deletionThreshold: number,
  batchSize: number
) {
  const promise = ctx.db
    .query('chats')
    .withIndex('by_type_deletionFailed_deleteTime', (q) =>
      q
        .eq('type', 'deleted')
        .eq('deletionFailed', undefined)
        .lt('deleteTime', deletionThreshold)
    )
    .take(batchSize);
  return tryCatch(promise);
}

async function getMessagesForChat(
  ctx: MutationCtx,
  chatId: Id<'chats'>,
  batchSize: number
) {
  const promise = ctx.db
    .query('messages')
    .withIndex('by_chat_update_time', (q) => q.eq('chatId', chatId))
    .take(batchSize);
  return tryCatch(promise);
}

async function deleteMessagesInBatches(
  ctx: MutationCtx,
  chatId: Id<'chats'>
): Promise<Result<void, Error>> {
  const batchSize = 100;
  const messagesResult = await getMessagesForChat(ctx, chatId, batchSize);

  if (messagesResult.isErr()) {
    return err(messagesResult.error);
  }

  const messages = messagesResult.value;
  const attachmentIds: Id<'_storage'>[] = [];

  const cleanup = async () => {
    const promises = messages.map((message) => {
      if (message.attachments) {
        attachmentIds.push(
          ...message.attachments.map((attachment) => attachment.fileId)
        );
      }
      return ctx.db.delete(message._id);
    });
    console.log(`Deleting ${promises.length} messages`);

    await Promise.all(promises);

    if (attachmentIds.length) {
      console.log(`Deleting ${attachmentIds.length} attachments`);
      await Promise.all(
        attachmentIds.map((attachmentId) => ctx.storage.delete(attachmentId))
      );
    }
  };

  await tryCatch(cleanup);

  if (messages.length === batchSize) {
    const nextBatchResult = await deleteMessagesInBatches(ctx, chatId);
    if (nextBatchResult.isErr()) {
      return err(nextBatchResult.error);
    }
  }

  return ok(undefined);
}

async function cleanupSingleChat(
  ctx: MutationCtx,
  chatId: Id<'chats'>
): Promise<Result<void, Error>> {
  const messagesResult = await deleteMessagesInBatches(ctx, chatId);
  if (messagesResult.isErr()) {
    console.error(
      `Error deleting messages for (${chatId}): ${messagesResult.error.message}`
    );
    await ctx.db.patch(chatId, {
      deletionFailed: true,
    });
    return err(messagesResult.error);
  }

  return tryCatch(ctx.db.delete(chatId));
}

async function batchDelete(
  ctx: MutationCtx,
  fiveMinutesAgo: number
): Promise<Result<void, Error>> {
  const batchSize = 25;
  const chatsResult = await getChatsPendingDeletion(
    ctx,
    fiveMinutesAgo,
    batchSize
  );

  if (chatsResult.isErr()) {
    return err(chatsResult.error);
  }

  const chats = chatsResult.value;
  console.log(`Found ${chats.length} chats to clear`);

  if (!chats.length) {
    return ok(undefined);
  }

  return tryCatch(async () => {
    await Promise.all(chats.map((chat) => cleanupSingleChat(ctx, chat._id)));
  });
}

export const clearDeletedChats = internalMutation({
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 1000 * 60 * 5;
    console.log('Clearing deleted chats', fiveMinutesAgo);
    await batchDelete(ctx, fiveMinutesAgo);
  },
});
