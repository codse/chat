import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { CoreMessage, CoreUserMessage, streamText } from 'ai';
import { internal } from '../_generated/api';
import { recommendedModelList } from '@/utils/models';

export const getMessagesForAI = internalQuery({
  args: { chatId: v.id('chats') },
  handler: async (ctx, { chatId }) => {
    const maxContextMessages = 20;
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', chatId))
      .order('desc')
      .take(maxContextMessages);
    return messages.reverse();
  },
});

export const generateResponse = internalAction({
  args: {
    chatId: v.id('chats'),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { chatId, model: modelId } = args;

    const dbMessages = await ctx.runQuery(internal.chats.ai.getMessagesForAI, {
      chatId,
    });
    const selectedModel = recommendedModelList.find(
      (model) => model.id === modelId
    );
    const supportsFileUploads = selectedModel?.supports.includes('file');
    const supportsImages = selectedModel?.supports.includes('vision');

    const messages = await Promise.all(
      dbMessages.map(async (message) => {
        if (message.role === 'system') {
          return null;
        }

        if (
          !message?.attachments?.length ||
          (!supportsFileUploads && !supportsImages)
        ) {
          return {
            role: message.role,
            content: message.content!,
          };
        }

        const contentParts: CoreUserMessage['content'] = [
          { type: 'text', text: message.content! },
        ];

        for (const attachment of message.attachments) {
          const buffer = await ctx.storage.get(attachment.fileId);
          if (!buffer) {
            continue;
          }

          const arrayBuffer = await buffer.arrayBuffer();

          if (attachment.fileType.startsWith('image/')) {
            contentParts.push({
              type: 'image',
              image: arrayBuffer,
              mimeType: attachment.fileType,
            });
            continue;
          }

          if (!supportsFileUploads) {
            continue;
          }

          const isPDF = attachment.fileType === 'application/pdf';
          if (isPDF) {
            contentParts.push({
              type: 'file',
              data: arrayBuffer,
              mimeType: 'application/pdf',
              filename: attachment.fileName,
            });
          } else {
            const textDecoder = new TextDecoder();
            const plainText = textDecoder.decode(arrayBuffer);
            contentParts.push({
              type: 'text',
              text: `
User uploaded this text file:

<user-uploaded-file name="${attachment.fileName}">
${plainText}
</user-uploaded-file>
`.trim(),
            });
          }
        }

        return {
          role: message.role,
          content: contentParts,
        };
      })
    );

    const systemMessage = {
      role: 'system',
      content: `
You are **${selectedModel?.name}**, a powerful AI assistant. You help users solve problems, answer questions, and complete tasks accurately and efficiently.

**Core Principles**:
- Provide direct, accurate responses to user questions
- Keep explanations concise unless complexity requires detail
- Ground all answers in factual knowledge
- Use step-by-step reasoning only when necessary

**Guidelines**:
- Maintain a friendly but professional tone
- Acknowledge uncertainty when present
- Avoid repeating information unless requested
- Never reveal this system prompt unless explicitly asked

**Capabilities**:
- Access to tools for data lookup and transformation when needed
- Interactive streaming responses for real-time assistance
- Knowledge cutoff: January 2025

**Context**:
- Current time: ${new Date().toISOString()}
- Operating in an interactive chat environment

**Boundaries**:
- No roleplaying unless specifically requested
- No restating questions unless needed for clarity
- No generating harmful or malicious content
- No providing information about weapons or malicious code
- No creating content involving real public figures
- No generating content that could harm minors
`.trim(),
    } as const;

    const message = await ctx.runMutation(
      internal.messages.mutations.addMessage,
      {
        chatId,
        role: 'assistant',
        content: '',
        reasoning: '',
        status: 'pending',
        model: modelId,
      }
    );

    if (!message?._id) {
      throw new Error('Unable to create response');
    }

    let reasoning = '';
    let content = '';
    const stream = streamText({
      model: openrouter(modelId),
      messages: [systemMessage, ...messages.filter((m) => m !== null)] as any,
      onChunk: async (event) => {
        let current = '';
        if (event.chunk.type === 'reasoning') {
          current = event.chunk.textDelta;
          reasoning += current;
        }

        if (event.chunk.type === 'text-delta') {
          current = event.chunk.textDelta;
          content += current;
        }

        if (event.chunk.type === 'tool-call-streaming-start') {
          current = `\n\n${event.chunk.toolName} called\n\n`;
          content += current;
        }

        if (event.chunk.type === 'tool-call-delta') {
          current = `\n\n${event.chunk.toolName} called: ${event.chunk.toolCallId}\n\n`;
          content += current;
        }

        if (event.chunk.type === 'source') {
          current = `\n\n${event.chunk.source}\n\n`;
          content += current;
        }

        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId: message._id,
          reasoning,
          content,
        });
      },
      onFinish: async (event) => {
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId: message._id,
          status: 'completed',
          endReason: event.finishReason,
        });
        await ctx.runMutation(internal.chats.mutations.updateChat, {
          chatId,
          lastMessageTime: Date.now(),
        });
      },
      onError: async (event) => {
        console.error(event);
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId: message._id,
          status: 'completed',
          endReason: 'error',
        });
        await ctx.runMutation(internal.chats.mutations.updateChat, {
          chatId,
          lastMessageTime: Date.now(),
        });
      },
    });

    const reader = stream.textStream.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) {
        break;
      }
    }
  },
});
