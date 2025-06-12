import { api, internal } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { internalMutation, mutation } from '@convex/_generated/server';
import { v } from 'convex/values';
import { MessageFields } from './table';
import { ALLOWED_FILE_TYPES } from '@/utils/uploads';

export const addMessage = internalMutation({
  args: {
    ...MessageFields,
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

    await ctx.scheduler.runAfter(0, internal.chats.mutations.updateChat, {
      chatId,
      lastMessageTime: Date.now(),
    });

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
    ...MessageFields,
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
    attachments: MessageFields.attachments,
    content: MessageFields.content,
    chatId: v.optional(MessageFields.chatId),
    model: MessageFields.model,
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

export const cloneChat = internalMutation({
  args: {
    newChatId: v.id('chats'),
    referenceId: v.optional(v.id('messages')),
    parentChatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    console.log('Cloning chat', args.parentChatId, 'to', args.newChatId);
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) =>
        q.eq('chatId', args.parentChatId)
      )
      .order('asc')
      .collect();
    console.log('Copying messages:', messages.length);

    await Promise.all(
      messages.map(({ _id, _creationTime, ...message }) =>
        ctx.db.insert('messages', {
          ...message,
          chatId: args.newChatId,
        })
      )
    );
    await ctx.scheduler.runAfter(0, internal.chats.mutations.updateChat, {
      chatId: args.newChatId,
      backfilled: true,
      lastMessageTime: Date.now(),
    });
    console.log(`Copied ${messages.length} messages to chat ${args.newChatId}`);
  },
});
