import { v } from 'convex/values';
import { query } from '../_generated/server';
import { internal } from '@convex/_generated/api';
import schema from '@convex/schema';
import { stream } from 'convex-helpers/server/stream';
import { IndexRange } from 'convex/server';

export const listChats = query({
  args: {
    mode: v.optional(v.union(v.literal('pinned'), v.literal('recent'))),
    paginationOpts: v.optional(
      v.object({
        limit: v.number(),
        cursor: v.union(v.string(), v.null()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;
    if (!userId) {
      return {
        chats: [],
        continueCursor: null,
        isDone: true,
        pageStatus: 'done',
      };
    }

    const chatStream = stream(ctx.db, schema)
      .query('chats')
      .withIndex('by_user_pinned_lastMessageTime', (q): IndexRange => {
        if (args.mode === 'pinned') {
          return q.eq('userId', userId).eq('pinned', true);
        }
        return q.eq('userId', userId).eq('pinned', undefined);
      })
      .order('desc')
      .filterWith(async (chat) => !chat.deleteTime && chat.source !== 'share')
      .paginate({
        numItems: args.paginationOpts?.limit ?? 10,
        cursor: args.paginationOpts?.cursor ?? null,
      });

    const { page, continueCursor, isDone, pageStatus } = await chatStream;

    return {
      chats: page,
      continueCursor,
      isDone,
      pageStatus,
    };
  },
});

export const getChat = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);

    if (!user) {
      return null;
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== user?._id) {
      return null;
    }

    return chat;
  },
});

export const getSharedChat = query({
  args: {
    chatId: v.id('chats'),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);

    if (!chat || chat.deleteTime) {
      throw new Error('Chat not found');
    }

    if (chat.source !== 'share') {
      throw new Error('Chat is no longer accessible');
    }

    const sharedBy = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', chat.userId))
      .unique();

    return {
      chat,
      sharedBy,
    };
  },
});
