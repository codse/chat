import { api, internal, components } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';

import {
  internalMutation,
  mutation,
  MutationCtx,
} from '@convex/_generated/server';
import { v } from 'convex/values';
import { MessageFields } from './table';
import { ALLOWED_FILE_TYPES } from '@/utils/uploads';
import { getAuthUserId } from '@convex-dev/auth/server';
import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';
import { MessageLimitPerDay } from '@convex/auth';

const createTemporaryTitle = (
  content: string,
  attachments?: { fileName: string }[]
) => {
  return content.slice(0, 50) || attachments?.[0]?.fileName || 'New Chat';
};

const ensureChat = async (
  ctx: MutationCtx,
  args: {
    chatId?: Id<'chats'>;
    content: string;
    attachments?: { fileName: string }[];
    model?: string;
    userId?: Id<'users'>;
  }
) => {
  let chatId = args.chatId;
  let currentModel = args.model;

  const title = createTemporaryTitle(args.content, args.attachments);

  if (!chatId) {
    chatId = await ctx.runMutation(api.chats.mutations.createChat, {
      title,
      model: args.model ?? 'gpt4o',
    });
  } else {
    const chat = await ctx.db.get(chatId as Id<'chats'>);
    if (!chat || chat.type === 'deleted' || chat.type === 'private') {
      throw new Error('Chat not found');
    }

    if (!currentModel) {
      currentModel = chat.model;
    }

    if (chat.source === 'share') {
      if (!args.userId) {
        throw new Error('User ID is required to clone a shared chat');
      }

      console.log('Creating a new chat from shared chat', chat._id);
      // If the user messages in a shared chat, we create a new chat with the same model.
      chatId = await ctx.runMutation(internal.chats.mutations.cloneChat, {
        chatId: chat._id,
        userId: args.userId,
        title: chat.title,
        model: currentModel,
      });
    }
  }

  return { chatId, model: currentModel };
};

const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessageWithKeys: { kind: 'token bucket', rate: 100, period: HOUR },
  sendMessageWithoutKeys: { kind: 'token bucket', rate: 10, period: HOUR },
});

export const addMessage = internalMutation({
  args: {
    ...MessageFields,
    userId: v.optional(v.id('users')),
    chatId: v.optional(v.id('chats')),
    userKeys: v.optional(
      v.object({
        openai: v.optional(v.string()),
        openrouter: v.optional(v.string()),
      })
    ),
    search: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Doc<'messages'> | null> => {
    if (
      !args.content?.trim().length &&
      !args.attachments?.length &&
      args.role === 'user'
    ) {
      throw new Error('Content or attachments are required');
    }

    const { chatId, model: currentModel } = await ensureChat(ctx, args);

    if (!currentModel) {
      throw new Error(
        'Model is required to generate a response for a user message.'
      );
    }

    const message: Omit<Doc<'messages'>, '_id' | '_creationTime'> = {
      chatId,
      role: args.role,
      content: args.content,
      reasoning: args.reasoning,
      attachments: args.attachments,
      model: currentModel,
      status: args.status,
      updateTime: Date.now(),
    };

    await ctx.scheduler.runAfter(0, internal.chats.mutations.updateChat, {
      chatId,
      model: currentModel,
      lastMessageTime: Date.now(),
    });

    console.log(`Inserting message for chat: ${message.chatId}`);
    const messageId = await ctx.db.insert('messages', message);

    if (args.role === 'user') {
      await ctx.scheduler.runAfter(0, internal.chats.ai.generateResponse, {
        chatId,
        model: currentModel,
        search: args.search,
        userKeys: args.userKeys,
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

const applyRateLimit = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  userKeys?: { openai?: string; openrouter?: string }
) => {
  const usingOwnKey = !!(userKeys?.openai || userKeys?.openrouter);
  let remainingMessages: number | null = null;

  // Hourly rate limit
  const { ok, retryAfter } = await rateLimiter.limit(
    ctx,
    // Apply different rate limits for users with their own keys and without
    // We want to apply limit on with keys because they might use invalid keys to
    // abuse the API. We don't know whether the provided keys are valid (yet).
    usingOwnKey ? 'sendMessageWithKeys' : 'sendMessageWithoutKeys',
    {
      key: userId,
    }
  );

  if (!ok) {
    throw new Error(
      `Hourly rate limit exceeded. Try again in ${Math.ceil(
        retryAfter / 1000 / 60
      )} minutes.`
    );
  }

  if (usingOwnKey) {
    // No daily quota for users with their own keys
    return { remainingMessages: null };
  }

  // Daily quota
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let messagesPerDay = user.messagesPerDay;
  if (messagesPerDay === undefined) {
    // Backwards compatibility
    messagesPerDay = user.isAnonymous
      ? MessageLimitPerDay.anonymous
      : MessageLimitPerDay.authenticated;
  }

  // Use messagesPerDay as the default value for messagesLeft
  remainingMessages = user.messagesLeft ?? messagesPerDay;
  if (remainingMessages <= 0) {
    throw new Error('Daily message quota exceeded.');
  }

  remainingMessages = Math.max(0, remainingMessages - 1);

  await ctx.db.patch(userId, {
    messagesPerDay,
    messagesLeft: remainingMessages,
  });

  return { remainingMessages };
};

export const sendMessage = mutation({
  args: {
    attachments: MessageFields.attachments,
    content: MessageFields.content,
    chatId: v.optional(MessageFields.chatId),
    model: MessageFields.model,
    userKeys: v.optional(
      v.object({
        openai: v.optional(v.string()),
        openrouter: v.optional(v.string()),
      })
    ),
    search: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    message: Doc<'messages'> | null;
    remainingMessages: number | null;
  }> => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const attachments = args.attachments ?? [];

    if (!args.content?.trim().length && !attachments.length) {
      throw new Error('Content or attachments are required');
    }

    for (const attachment of attachments) {
      const isImage = attachment.fileType.startsWith('image/');
      if (!isImage && !ALLOWED_FILE_TYPES.includes(attachment.fileType)) {
        throw new Error(`File type ${attachment.fileType} is not allowed.`);
      }
    }

    const { remainingMessages } = await applyRateLimit(
      ctx,
      userId,
      args.userKeys
    );

    const message = await ctx.runMutation(
      internal.messages.mutations.addMessage,
      {
        chatId: args.chatId,
        role: 'user',
        userId,
        content: String(args.content || '').trim(),
        attachments: args.attachments,
        model: args.model,
        status: 'completed',
        userKeys: args.userKeys,
        search: args.search,
      }
    );

    return {
      message,
      remainingMessages,
    };
  },
});

export const cloneMessages = internalMutation({
  args: {
    newChatId: v.id('chats'),
    referenceId: v.id('messages'),
    parentChatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    console.log(`Cloning chat ${args.parentChatId} to ${args.newChatId}`);
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) =>
        q.eq('chatId', args.parentChatId)
      )
      .order('asc')
      .collect();
    console.log(`Copying ${messages.length} messages`);

    const refIndex = messages.findIndex((m) => m._id === args.referenceId);
    const messagesToCopy = messages.slice(0, refIndex + 1);

    let updates: Partial<Doc<'chats'>> = {};

    if (messagesToCopy.length) {
      updates = {
        model: messagesToCopy[messagesToCopy.length - 1].model,
      };

      await Promise.all(
        messagesToCopy.map(({ _id, _creationTime, ...message }) =>
          ctx.db.insert('messages', {
            ...message,
            chatId: args.newChatId,
          })
        )
      );
    }

    await ctx.scheduler.runAfter(0, internal.chats.mutations.updateChat, {
      chatId: args.newChatId,
      backfilled: true,
      ...updates,
      lastMessageTime: Date.now(),
    });
    console.log(`Copied ${messages.length} messages to chat ${args.newChatId}`);
  },
});

export const addFile = internalMutation({
  args: {
    messageId: v.id('messages'),
    file: v.object({
      id: v.id('_storage'),
      mimeType: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      console.error('Message not found', args.messageId);
      return;
    }

    const attachments = [
      ...(message.attachments ?? []),
      {
        fileId: args.file.id,
        fileName: `generated.${args.file.mimeType.split('/')[1] || 'bin'}`,
        fileType: args.file.mimeType,
      },
    ];

    await ctx.db.patch(args.messageId, {
      attachments,
    });
  },
});
