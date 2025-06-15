import { query } from '../_generated/server';
import { v } from 'convex/values';
import { mergedStream, stream } from 'convex-helpers/server/stream';
import convexSchema from '@convex/schema';
import { getAuthUserId } from '@convex-dev/auth/server';

export const getChatMessages = query({
  args: {
    chatId: v.id('chats'),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const isSharedChat = chat.source === 'share';
    if (!isSharedChat) {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error('User not found');
      }

      if (chat.userId !== userId) {
        throw new Error('Unauthorized');
      }
    }

    const paginationOpts = {
      numItems: args.paginationOpts?.numItems ?? 10,
      cursor: args.paginationOpts?.cursor,
    };

    const referenceId = chat.referenceId;
    const parentId = chat.parentId;
    if (isSharedChat && !chat.backfilled && referenceId && parentId) {
      // Backfilling is not complete, return the original chat upto the referenceId
      const originalStream = stream(ctx.db, convexSchema)
        .query('messages')
        .withIndex('by_chat_update_time', (q) => q.eq('chatId', parentId))
        .order('asc');

      const newMessages = stream(ctx.db, convexSchema)
        .query('messages')
        .withIndex('by_chat_update_time', (q) => q.eq('chatId', args.chatId))
        .order('asc');

      const response = await mergedStream(
        [originalStream, newMessages],
        ['chatId', 'updateTime', '_creationTime', '_id']
      ).paginate(paginationOpts);

      return response;
    }

    const response = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .paginate(paginationOpts);

    return response;
  },
});
