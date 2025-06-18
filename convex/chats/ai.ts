import { v } from 'convex/values';
import { ActionCtx, internalAction, internalQuery } from '../_generated/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  CoreUserMessage,
  streamText,
  ToolChoice,
  LanguageModel,
  ToolSet,
  LanguageModelV1CallOptions,
  JSONValue,
} from 'ai';
import { internal } from '../_generated/api';
import { Model, recommendedModelList } from '@/utils/models';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { Id } from '@convex/_generated/dataModel';

export const getMessagesForAI = internalQuery({
  args: { chatId: v.id('chats'), count: v.number() },
  handler: async (ctx, { chatId, count }) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_update_time', (q) => q.eq('chatId', chatId))
      .order('desc')
      .take(count);
    return messages.reverse();
  },
});

interface ModelConfig {
  model: LanguageModel;
  tools?: ToolSet;
  toolChoice?: ToolChoice<ToolSet>;
  providerOptions?: LanguageModelV1CallOptions['providerMetadata'];
}

const createModelConfig = (
  model: Model,
  userKeys?: { openai?: string; openrouter?: string },
  options: { search?: boolean } = {}
): ModelConfig => {
  const isSearching = options.search && model.supports.includes('search');

  if (model.id.startsWith('openai/') && userKeys?.openai) {
    const openaiModelId = model.id.replace('openai/', '');
    const openaiProvider = createOpenAI({ apiKey: userKeys.openai });
    let modelProvider: LanguageModel = openaiProvider(openaiModelId);
    let tools: ToolSet | undefined = undefined;
    let toolChoice: ToolChoice<ToolSet> | undefined = undefined;
    let providerOptions: Record<string, Record<string, JSONValue>> | undefined =
      undefined;

    if (isSearching) {
      if (model.capabilities?.includes('tool-call')) {
        tools = {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: 'medium',
          }),
        };
        toolChoice = { type: 'tool', toolName: 'web_search_preview' };
        console.log('Using web_search_preview');
      } else {
        providerOptions = {
          openai: {
            web_search_preview: {
              searchContextSize: 'medium',
            },
          },
        };
        console.log('Using providerOptions for web search');
      }
    }

    return {
      model: modelProvider,
      tools,
      toolChoice,
      providerOptions,
    };
  }

  if (userKeys?.openrouter) {
    // https://openrouter.ai/docs/features/web-search
    const modelId = model.id + (isSearching ? ':online' : '');
    console.log(`Using user key for OpenRouter: (${modelId})`);
    const modelProvider = createOpenRouter({ apiKey: userKeys.openrouter })(
      modelId
    );

    return {
      model: modelProvider,
    };
  }

  if (model.free) {
    console.log(`Using free model: (${model.id})`);
    const modelProvider = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })(model.id);
    return {
      model: modelProvider,
    };
  }

  throw new Error(
    'API key required for this model. Please add your key in the sidebar'
  );
};

const getRecentMessages = async (
  ctx: ActionCtx,
  { chatId, count, model }: { chatId: Id<'chats'>; count: number; model: Model }
) => {
  const dbMessages = await ctx.runQuery(internal.chats.ai.getMessagesForAI, {
    chatId,
    count,
  });
  const supportsFileUploads = model?.supports.includes('file');
  const supportsImages = model?.supports.includes('vision');

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

<user-uploaded-file-content name="${attachment.fileName}">
${plainText}
</user-uploaded-file-content>
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

  return messages.filter((m) => m !== null);
};

export const generateResponse = internalAction({
  args: {
    chatId: v.id('chats'),
    model: v.string(),
    userKeys: v.optional(
      v.object({
        openai: v.optional(v.string()),
        openrouter: v.optional(v.string()),
      })
    ),
    search: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { chatId, model: modelId, userKeys, search } = args;
    const selectedModel = recommendedModelList.find(
      (model) => model.id === modelId
    );

    if (!selectedModel) {
      throw new Error('Model is not supported');
    }

    const config = createModelConfig(selectedModel, userKeys, { search });

    const messages = await getRecentMessages(ctx, {
      chatId,
      count: 20,
      model: selectedModel,
    });

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
    const sources: { url: string; title: string; metadata: string }[] = [];

    // TODO: use text streaming helper from convex to stream to the original client.
    // This will allow us to stream to the client without having to write to the DB every time.
    // https://www.npmjs.com/package/@convex-dev/persistent-text-streaming

    const stream = streamText({
      ...config,
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

        if (event.chunk.type === 'source') {
          // TODO: fix this.
          // This is not working as expected.
          sources.push({
            url: event.chunk.source.url,
            title: event.chunk.source.title ?? '',
            metadata: event.chunk.source.providerMetadata
              ? JSON.stringify(event.chunk.source.providerMetadata)
              : '',
          });
        }

        if (current) {
          await ctx.runMutation(internal.messages.mutations.updateMessage, {
            messageId: message._id,
            reasoning,
            content,
          });
        }
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
        console.error(
          'There was an error generating the response.',
          (event.error as Error)?.message
        );
        await Promise.all([
          ctx.runMutation(internal.messages.mutations.updateMessage, {
            messageId: message._id,
            status: 'completed',
            endReason: 'error',
          }),
          ctx.runMutation(internal.chats.mutations.updateChat, {
            chatId,
            lastMessageTime: Date.now(),
          }),
        ]);
      },
    });

    const reader = stream.textStream.getReader();
    while (true) {
      // Convex doesn't keep the process alive, so we need to keep the reader alive.
      // This is a hack to keep the process alive.
      // TODO: find a better way to do this.
      const { done } = await reader.read();
      if (done) {
        break;
      }
    }

    const [steps, _sources, files] = await Promise.all([
      stream.steps,
      stream.sources,
      stream.files,
    ]);

    await ctx.runMutation(internal.messages.mutations.updateMessage, {
      messageId: message._id,
      sources,
      toolCalls: steps.flatMap((step) =>
        step.toolResults.map((result) => {
          return {
            // @ts-expect-error
            name: result.toolName,
            // @ts-expect-error
            result: JSON.stringify(result.result),
          };
        })
      ),
    });

    for (const file of files) {
      const isImage = file.mimeType.startsWith('image/');
      const data = isImage
        ? Uint8Array.from(Buffer.from(file.base64, 'base64'))
        : file.uint8Array;
      const uploadedFile = await ctx.storage.store(
        new Blob([data], { type: file.mimeType })
      );
      console.log('Uploaded file', uploadedFile);

      await ctx.runMutation(internal.messages.mutations.addFile, {
        messageId: message._id,
        file: {
          id: uploadedFile,
          mimeType: file.mimeType,
        },
      });
    }
  },
});
