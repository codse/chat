import { MutationCtx, QueryCtx } from '../_generated/server';
import { Doc, Id } from '@convex/_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';
import { err, ok, Result } from 'neverthrow';

function checkChatPermissions(
  ctx: MutationCtx | QueryCtx,
  chatId: Id<'chats'>
): Promise<
  Result<
    {
      user: {
        _id: Id<'users'>;
      };
      chat: Doc<'chats'>;
    },
    Error
  >
>;

function checkChatPermissions(
  ctx: MutationCtx | QueryCtx,
  chatId?: null
): Promise<
  Result<
    {
      user: {
        _id: Id<'users'>;
      };
      chat: null;
    },
    Error
  >
>;

function checkChatPermissions(
  ctx: MutationCtx | QueryCtx,
  chatId: Id<'chats'>,
  includeDeleted: boolean
): Promise<
  Result<
    {
      user: {
        _id: Id<'users'>;
      };
      chat: Doc<'chats'> | null;
    },
    Error
  >
>;

async function checkChatPermissions(
  ctx: MutationCtx | QueryCtx,
  chatId: Id<'chats'> | null = null,
  includeDeleted: boolean = false
): Promise<
  Result<
    {
      user: {
        _id: Id<'users'>;
      };
      chat: Doc<'chats'> | null;
    },
    Error
  >
> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return err(new Error('Not authenticated'));
  }

  const user = {
    _id: userId,
  };

  if (!chatId) {
    return ok({
      user,
      chat: null,
    });
  }

  const chat = await ctx.db.get(chatId);
  if (!chat) {
    return err(new Error('Chat not found'));
  }

  // If the chat is deleted or private, it is not accessible to the user
  const isDeleted = chat.type === 'deleted' || chat.type === 'private';
  if (isDeleted && !includeDeleted) {
    return err(new Error('Chat not found'));
  }

  if (chat.userId !== userId) {
    return err(new Error('Unauthorized'));
  }

  return ok({
    user,
    chat,
  });
}

export { checkChatPermissions };
