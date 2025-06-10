import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { IndexRange } from 'convex/server';
import { Id } from '@convex/_generated/dataModel';

export const createChat = mutation({
  args: {
    title: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'chats'>> => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const chatId = await ctx.db.insert('chats', {
      title: args.title,
      userId,
      pinned: false,
      model: args.model,
    });

    return chatId;
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.id('chats'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.title?.trim().length) {
      throw new Error('Title is required');
    }

    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or unauthorized');
    }

    await ctx.db.patch(args.chatId, { title: args.title });
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or unauthorized');
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query('messages')
      .withIndex(
        'by_chat_update_time',
        (q): IndexRange => q.eq('chatId', args.chatId)
      )
      .order('desc')
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, {
        deleteTime: Date.now(),
      });
    }

    // Delete the chat
    await ctx.db.patch(args.chatId, {
      deleteTime: Date.now(),
    });
  },
});

export const shareChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or unauthorized');
    }

    await ctx.db.patch(args.chatId, {
      shared: true,
    });
  },
});

export const pinChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or unauthorized');
    }

    await ctx.db.patch(args.chatId, { pinned: !chat.pinned });
  },
});
