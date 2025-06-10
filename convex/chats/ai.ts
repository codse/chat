import { v } from 'convex/values';
import { internalAction, internalMutation } from '../_generated/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { smoothStream, streamText } from 'ai';
import { api, internal } from '../_generated/api';

export const generateResponse = internalAction({
  args: {
    chatId: v.id('chats'),
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
      })
    ),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { chatId, messages, model } = args;

    const systemMessage = {
      role: 'system',
      content: `
You are **${model}**, a powerful AI assistant. You help users solve problems, answer questions, and complete tasks accurately and efficiently.

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

    const { messageId } = await ctx.runMutation(
      internal.messages.mutations.addMessage,
      {
        chatId,
        role: 'assistant',
        content: '',
        reasoning: '',
        status: 'pending',
        model,
      }
    );

    if (!messageId) {
      throw new Error('Unable to create response');
    }

    let reasoning = '';
    let content = '';
    const stream = streamText({
      model: openrouter(model),
      messages: [systemMessage, ...messages],
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
          messageId,
          reasoning,
          content,
        });
      },
      onFinish: async (event) => {
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId,
          status: 'completed',
          endReason: event.finishReason,
        });
      },
      onError: async (event) => {
        console.log(event);
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId,
          status: 'completed',
          endReason: 'error',
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
