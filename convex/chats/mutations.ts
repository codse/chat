import { v } from 'convex/values';
import { internalMutation, mutation, MutationCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { IndexRange } from 'convex/server';
import { Doc, Id } from '@convex/_generated/dataModel';

function checkChatPermissions(
  ctx: MutationCtx,
  chatId: Id<'chats'>
): Promise<{
  user: Doc<'users'>;
  chat: Doc<'chats'>;
}>;

function checkChatPermissions(
  ctx: MutationCtx,
  chatId?: null
): Promise<{
  user: Doc<'users'>;
  chat: null;
}>;

async function checkChatPermissions(
  ctx: MutationCtx,
  chatId: Id<'chats'> | null = null
) {
  const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
  const userId = user?._id;
  if (!userId) {
    throw new Error('Not authenticated');
  }

  if (!chatId) {
    return {
      user,
      chat: null,
    };
  }

  const chat = await ctx.db.get(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  if (chat.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return {
    user,
    chat,
  };
}

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

    const { user } = await checkChatPermissions(ctx);
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

    await checkChatPermissions(ctx, args.chatId);
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
    await checkChatPermissions(ctx, args.chatId);

    // Delete all messages in the chat
    const messages = await ctx.db
      .query('messages')
      .withIndex(
        'by_chat_update_time',
        (q): IndexRange => q.eq('chatId', args.chatId)
      )
      .order('desc')
      .collect();

    await Promise.all(
      messages.map((message) =>
        ctx.db.patch(message._id, {
          deleteTime: Date.now(),
        })
      )
    );

    // Delete the chat
    await ctx.db.patch(args.chatId, {
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
    source: v.union(v.literal('branch'), v.literal('share')),
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

    await ctx.scheduler.runAfter(0, internal.messages.mutations.cloneChat, {
      newChatId,
      parentChatId: args.chatId,
    });

    return newChatId;
  },
});

export const shareChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const { chat } = await checkChatPermissions(ctx, args.chatId);
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
    const { chat } = await checkChatPermissions(ctx, args.chatId);
    console.log('Branching chat', args.chatId, 'with model', args.model);
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
    const { chat } = await checkChatPermissions(ctx, args.chatId);

    await ctx.db.patch(args.chatId, {
      pinned: chat.pinned ? undefined : true,
      updateTime: Date.now(),
    });
  },
});
