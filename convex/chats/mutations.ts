import { v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { checkChatPermissions } from './permissions';

export const createChat = mutation({
  args: {
    title: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'chats'>> => {
    if (!args.title?.trim()) {
      throw new Error('Title is required');
    }

    if (!args.model?.trim()) {
      throw new Error('Model is required');
    }

    const result = await checkChatPermissions(ctx);
    if (result.isErr()) {
      throw result.error;
    }

    const { user } = result.value;
    const sanitizedTitle = args.title.trim();

    const chatId = await ctx.db.insert('chats', {
      title: sanitizedTitle,
      userId: user._id,
      lastMessageTime: Date.now(),
      model: args.model,
    });

    return chatId;
  },
});

export const updateChat = internalMutation({
  args: {
    chatId: v.id('chats'),
    title: v.optional(v.string()),
    model: v.optional(v.string()),
    backfilled: v.optional(v.boolean()),
    referenceId: v.optional(v.id('messages')),
    lastMessageTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { chatId, ...updates } = args;

    await ctx.db.patch(args.chatId, {
      ...updates,
      updateTime: Date.now(),
    });
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.id('chats'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.title?.trim()) {
      throw new Error('Title is required');
    }

    const result = await checkChatPermissions(ctx, args.chatId);
    if (result.isErr()) {
      throw result.error;
    }

    const sanitizedTitle = args.title.trim();

    await ctx.runMutation(internal.chats.mutations.updateChat, {
      chatId: args.chatId,
      title: sanitizedTitle,
    });
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const result = await checkChatPermissions(ctx, args.chatId, true);
    if (result.isErr()) {
      throw result.error;
    }

    // Mark the chat as deleted. This will be cleared by the cron job.
    await ctx.db.patch(args.chatId, {
      type: 'deleted',
      deleteTime: Date.now(),
    });
  },
});

export const cloneChat = internalMutation({
  args: {
    chatId: v.id('chats'),
    userId: v.id('users'),
    title: v.string(),
    model: v.string(),
    source: v.optional(v.union(v.literal('branch'), v.literal('share'))),
  },
  handler: async (ctx, args) => {
    const lastMessage = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', args.chatId))
      .order('desc')
      .first();

    const newChatId = await ctx.db.insert('chats', {
      title: args.title,
      userId: args.userId,
      model: args.model,
      referenceId: lastMessage?._id,
      parentId: args.chatId,
      updateTime: Date.now(),
      source: args.source,
    });

    await ctx.scheduler.runAfter(0, internal.messages.mutations.cloneMessages, {
      newChatId,
      parentChatId: args.chatId,
    });

    return newChatId;
  },
});

export const shareChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const result = await checkChatPermissions(ctx, args.chatId);
    if (result.isErr()) {
      throw result.error;
    }

    const { chat } = result.value;
    const newChatId: Id<'chats'> = await ctx.runMutation(
      internal.chats.mutations.cloneChat,
      {
        chatId: args.chatId,
        userId: chat.userId,
        title: chat.title,
        model: chat.model,
        source: 'share',
      }
    );

    return newChatId;
  },
});

export const branchChat = mutation({
  args: { chatId: v.id('chats'), model: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await checkChatPermissions(ctx, args.chatId);
    if (result.isErr()) {
      throw result.error;
    }

    const { chat } = result.value;
    console.log(`Branching chat ${args.chatId} with model ${args.model}`);

    const newChatId: Id<'chats'> = await ctx.runMutation(
      internal.chats.mutations.cloneChat,
      {
        chatId: args.chatId,
        userId: chat.userId,
        title: chat.title,
        source: 'branch',
        model: args.model ?? chat.model,
      }
    );

    return newChatId;
  },
});

export const pinChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const result = await checkChatPermissions(ctx, args.chatId);
    if (result.isErr()) {
      throw result.error;
    }
    const { chat } = result.value;

    await ctx.db.patch(args.chatId, {
      type: chat.type === 'pinned' ? undefined : 'pinned',
      updateTime: Date.now(),
    });
  },
});
