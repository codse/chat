import { api, internal } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { internalMutation, mutation } from '@convex/_generated/server';
import { v } from 'convex/values';
import { Message } from './table';
import { ALLOWED_FILE_TYPES } from '@/utils/uploads';

export const addMessage = internalMutation({
  args: {
    ...Message,
    chatId: v.optional(v.id('chats')),
  },
  handler: async (ctx, args): Promise<Doc<'messages'> | null> => {
    if (
      !args.content?.trim().length &&
      (!args.attachments || args.attachments.length === 0) &&
      args.role === 'user'
    ) {
      throw new Error('Content or attachments are required');
    }

    let chatId = args.chatId;
    let currentModel = args.model;
    let lastModel: string | undefined;
    if (!chatId) {
      const title =
        args.content?.slice(0, 50) ||
        args.attachments?.[0]?.fileName ||
        'New Chat';
      chatId = await ctx.runMutation(api.chats.mutations.createChat, {
        title,
        model: args.model ?? 'gpt4o',
      });
    } else {
      const chat = await ctx.db.get(chatId as Id<'chats'>);
      if (!chat) {
        throw new Error('Chat not found');
      }
      lastModel = chat.model;
      if (!currentModel) {
        currentModel = lastModel;
      }
    }

    if (!chatId) {
      throw new Error('Chat not found');
    }

    if (!currentModel) {
      throw new Error(
        'Model is required to generate a response for a user message.'
      );
    }

    const message = {
      chatId,
      role: args.role,
      content: args.content,
      reasoning: args.reasoning,
      attachments: args.attachments,
      model: currentModel,
      status: args.status,
    };

    if (lastModel !== currentModel) {
      // Update chat to track last model
      await ctx.scheduler.runAfter(0, internal.chats.mutations.updateChat, {
        chatId,
        model: currentModel,
      });
    }

    const messageId = await ctx.db.insert('messages', message);

    if (args.role === 'user') {
      await ctx.scheduler.runAfter(0, internal.chats.ai.generateResponse, {
        chatId,
        model: currentModel,
      });
    }

    return ctx.db.get(messageId);
  },
});

export const updateMessage = internalMutation({
  args: {
    messageId: v.id('messages'),
    ...Message,
    chatId: v.optional(v.id('chats')),
    content: v.optional(v.string()),
    role: v.optional(v.union(v.literal('user'), v.literal('assistant'))),
  },
  handler: async (ctx, args) => {
    const { messageId, ...message } = args;
    await ctx.db.patch(messageId, message);
  },
});

export const sendMessage = mutation({
  args: {
    attachments: Message.attachments,
    content: Message.content,
    chatId: v.optional(Message.chatId),
    model: Message.model,
  },
  handler: async (ctx, args): Promise<Doc<'messages'> | null> => {
    const user = await ctx.runQuery(internal.users.queries.getCurrentUser);
    const userId = user?._id;

    if (args.attachments) {
      for (const attachment of args.attachments) {
        if (!ALLOWED_FILE_TYPES.includes(attachment.fileType)) {
          const isImage = attachment.fileType.startsWith('image/');
          if (!isImage) {
            throw new Error(`File type ${attachment.fileType} is not allowed.`);
          }
        }
      }
    }

    if (!args.content?.trim().length && !args.attachments?.length) {
      throw new Error('Content or attachments are required');
    }

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return await ctx.runMutation(internal.messages.mutations.addMessage, {
      chatId: args.chatId,
      role: 'user',
      content: (args.content ?? '').trim(),
      attachments: args.attachments,
      model: args.model,
      status: 'completed',
    });
  },
});
