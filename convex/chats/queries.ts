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
      .withIndex('by_user_pinned_update_time', (q): IndexRange => {
        if (args.mode === 'pinned') {
          return q.eq('userId', userId).eq('pinned', true);
        }
        return q.eq('userId', userId).eq('pinned', false);
      })
      .order('desc')
      .filterWith(async (chat) => !chat.deleteTime)
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
    console.log('received http request', args.chatId);
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    if (!user) {
      // return null;
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== user?._id) {
      return null;
    }

    return chat;
  },
});

export const getChatMessages = query({
  args: {
    chatId: v.id('chats'),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    if (!user) {
      throw new Error('User not found');
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId !== user._id) {
      throw new Error('Unauthorized');
    }

    const response = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .paginate({
        numItems: args.paginationOpts?.numItems ?? 10,
        cursor: args.paginationOpts?.cursor,
      });

    return response;
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
    const sharedChat = await ctx.db
      .query('chats')
      .withIndex('by_shared_update_time', (q) => q.eq('shared', true))
      .filter((q) => q.eq(q.field('_id'), args.chatId))
      .unique();

    if (!sharedChat) {
      return null;
    }

    const chat = await ctx.db.get(sharedChat._id);
    if (!chat) {
      return null;
    }

    const { page, continueCursor, isDone, pageStatus } = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', sharedChat._id))
      .order('desc')
      .paginate({
        numItems: args.paginationOpts?.numItems ?? 10,
        cursor: args.paginationOpts?.cursor,
      });

    const messagesWithUrls = await Promise.all(
      page.map(async (message) => {
        if (message.attachments) {
          const attachmentsWithUrls = await Promise.all(
            message.attachments.map(async (attachment) => ({
              ...attachment,
              url: await ctx.storage.getUrl(attachment.fileId),
            }))
          );
          return { ...message, attachments: attachmentsWithUrls };
        }
        return message;
      })
    );

    return {
      chat,
      messages: messagesWithUrls,
      sharedBy: sharedChat.userId,
      continueCursor,
      isDone,
      pageStatus,
    };
  },
});
