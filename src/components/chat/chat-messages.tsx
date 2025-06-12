'use client';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/ui/chat-container';
import { Markdown } from '@/components/ui/markdown';
import { Message, MessageContent } from '@/components/ui/message';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
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
import { AttachmentPreview } from './attachment-preview';

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
      <div className="flex flex-col gap-2 w-full">
        {showLoading && (
          <div className="px-4">
            <Loader
              variant={message.reasoning ? 'text-shimmer' : 'typing'}
              text={message.reasoning ? 'Reasoning...' : ''}
            />
          </div>
        )}
        <AttachmentPreview
          attachments={message.attachments}
          errors={[]}
          preview
          isUploading={false}
        />
        {isAssistant && (
          <div className="prose rounded-lg p-2 [&:has(pre)]:max-w-full max-w-[85%] sm:max-w-[75%] w-fit">
            <MessageContent className="bg-transparent leading-normal" markdown>
              {message.content}
            </MessageContent>
            {message.endReason === 'error' && (
              <MessageContent className="bg-orange-50 text-orange-500 px-3.5 py-2.5 border border-orange-500/10 rounded-lg">
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
        )}
        {!isAssistant && Boolean(message.content?.length) && (
          <MessageContent className="max-w-[85%] self-end sm:max-w-[75%] w-fit bg-foreground/5 p-4 border border-foreground/10 rounded-lg text-foreground/95">
            {message.content}
          </MessageContent>
        )}
      </div>
    </Message>
  );
}

export function ChatMessages({
  chatId,
  initialMessage,
  className,
}: {
  chatId: string;
  initialMessage?: Doc<'messages'> | null;
  className?: string;
}) {
  const { data } = useSuspenseQuery({
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
              ...initialMessage,
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
