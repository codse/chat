import { api, internal } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { internalMutation, mutation } from '@convex/_generated/server';
import { IndexRange } from 'convex/server';
import { v } from 'convex/values';
import { Message } from './table';

export const addMessage = internalMutation({
  args: {
    ...Message,
    chatId: v.optional(v.id('chats')),
  },
  handler: async (ctx, args): Promise<Doc<'messages'> | null> => {
    if (!args.content?.trim().length && args.role === 'user') {
      throw new Error('Content is required');
    }

    let chatId = args.chatId;
    let currentModel = args.model;
    let lastModel: string | undefined;
    if (!chatId) {
      chatId = await ctx.runMutation(api.chats.mutations.createChat, {
        title: args.content.slice(0, 50),
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
      // Get the last 20 messages for the chat
      const maxContextMessages = 20;
      const messages = await ctx.db
        .query('messages')
        .withIndex(
          'by_chat_update_time',
          (q): IndexRange => q.eq('chatId', chatId)
        )
        .order('desc')
        .take(maxContextMessages);

      // Map the messages to the format expected by the generateResponse function
      const mappedMessages = messages
        .map(({ role, content }) => {
          if (role === 'system') {
            return null;
          }
          return {
            role,
            content: content!,
          };
        })
        .reverse();

      await ctx.scheduler.runAfter(0, internal.chats.ai.generateResponse, {
        chatId,
        messages: mappedMessages.filter((message) => message !== null) as {
          role: 'user' | 'assistant';
          content: string;
        }[],
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

    if (!args.content?.trim().length) {
      throw new Error('Content is required');
    }

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return await ctx.runMutation(internal.messages.mutations.addMessage, {
      chatId: args.chatId,
      role: 'user',
      content: String(args.content).trim(),
      attachments: args.attachments,
      model: args.model,
      status: 'completed',
    });
  },
});
