import { api, internal } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import {
  internalAction,
  internalMutation,
  mutation,
  MutationCtx,
} from '@convex/_generated/server';
import { v } from 'convex/values';
import { MessageFields } from './table';
import { ALLOWED_FILE_TYPES } from '@/utils/uploads';
import { getAuthUserId } from '@convex-dev/auth/server';

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
  handler: async (ctx, args): Promise<Doc<'messages'> | null> => {
    const userId = await getAuthUserId(ctx);

    // We will check permissions later in the addMessage mutation because it this point the chat might not exist yet.
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

    return ctx.runMutation(internal.messages.mutations.addMessage, {
      chatId: args.chatId,
      role: 'user',
      userId,
      content: String(args.content || '').trim(),
      attachments: args.attachments,
      model: args.model,
      status: 'completed',
      userKeys: args.userKeys,
      search: args.search,
    });
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
