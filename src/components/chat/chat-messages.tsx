'use client';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/ui/chat-container';
import { Markdown } from '@/components/ui/markdown';
import { Message, MessageContent } from '@/components/ui/message';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Reasoning,
  ReasoningContent,
  ReasoningResponse,
  ReasoningTrigger,
} from '../ui/reasoning';
import { ScrollButton } from '../ui/scroll-button';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Message as MessageType } from '@/types/chat';

function ChatMessage({
  message,
  isLastMessage,
}: {
  message: MessageType;
  isLastMessage: boolean;
}) {
  const isAssistant = message.role === 'assistant';
  const showLoading = message.status === 'pending' && !message.content?.length;

  return (
    <Message
      key={message._id}
      className={cn({
        'justify-end': message.role === 'user',
        'justify-start': message.role === 'assistant',
        'min-h-[calc(100dvh-125px-var(--vh-offset))]': isLastMessage,
      })}
    >
      {isAssistant ? (
        <div className="prose rounded-lg p-2 max-w-[85%] sm:max-w-[75%] w-fit">
          <MessageContent className="bg-transparent leading-normal" markdown>
            {message.content}
          </MessageContent>
          {message.endReason === 'error' && (
            <MessageContent className="bg-orange-50 text-orange-500">
              There was an error generating the response.
            </MessageContent>
          )}
          {Boolean(message.reasoning?.length) && (
            <Reasoning defaultOpen={false} className="px-2 text-sm">
              <ReasoningTrigger>Show reasoning</ReasoningTrigger>
              {message?.status === 'pending' ? (
                <ReasoningResponse text={message.reasoning as string} />
              ) : (
                <ReasoningContent>
                  <Markdown>{message.reasoning as string}</Markdown>
                </ReasoningContent>
              )}
            </Reasoning>
          )}
        </div>
      ) : (
        <MessageContent className="max-w-[85%] sm:max-w-[75%] w-fit bg-foreground/5 p-4 border border-foreground/10 rounded-lg text-foreground/95">
          {message.content}
        </MessageContent>
      )}
      {showLoading && (
        <Loader
          variant={message.reasoning ? 'text-shimmer' : 'typing'}
          text={message.reasoning ? 'Reasoning...' : ''}
        />
      )}
    </Message>
  );
}

export function ChatMessages({
  chatId,
  initialMessage,
  className,
}: {
  chatId: string;
  initialMessage?: string;
  className?: string;
}) {
  const { data, isLoading, isError } = useSuspenseQuery({
    ...convexQuery(api.chats.queries.getChatMessages, {
      chatId: chatId as Id<'chats'>,
      paginationOpts: {
        cursor: null,
        numItems: 100000,
      },
    }),
    staleTime: 3000,
    gcTime: 3000,
    initialData: initialMessage
      ? {
          page: [
            {
              _id: 'initial' as Id<'messages'>,
              _creationTime: Date.now(),
              role: 'user',
              content: initialMessage,
              chatId: chatId as Id<'chats'>,
            },
          ],
          isDone: false,
          continueCursor: '',
        }
      : {
          page: [],
          isDone: true,
          continueCursor: '',
        },
  });

  const messages = data?.page ?? [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <div
      className={cn(
        'h-full w-full overflow-y-auto overflow-x-hidden flex-1 flex flex-col relative',
        className
      )}
    >
      <ChatContainerRoot className="flex relative w-full flex-col mx-auto flex-1">
        <ChatContainerContent className="space-y-4 max-w-[var(--breakpoint-md)] mx-auto p-4 w-full">
          {messages.map((message, index) => (
            <ChatMessage
              key={message._id}
              message={message}
              isLastMessage={index === messages.length - 1}
            />
          ))}
        </ChatContainerContent>
        <ScrollButton
          variant="secondary"
          className="absolute z-50 bottom-4 left-1/2 -translate-x-1/2"
        />
      </ChatContainerRoot>
    </div>
  );
}
