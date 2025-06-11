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
      pinned: false,
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
  },
  handler: async (ctx, args) => {
    let updates: Partial<Doc<'chats'>> = {};
    if (args.title) {
      updates.title = args.title;
    }
    if (args.model) {
      updates.model = args.model;
    }

    await ctx.db.patch(args.chatId, updates);
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

export const shareChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    await checkChatPermissions(ctx, args.chatId);

    await ctx.db.patch(args.chatId, {
      shared: true,
    });
  },
});

export const pinChat = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const { chat } = await checkChatPermissions(ctx, args.chatId);

    await ctx.db.patch(args.chatId, { pinned: !chat.pinned });
  },
});
