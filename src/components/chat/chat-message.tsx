'use client';

import { Markdown } from '@/components/ui/markdown';
import { Message, MessageContent } from '@/components/ui/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningResponse,
  ReasoningTrigger,
} from '../ui/reasoning';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Message as MessageType } from '@/types/chat';
import { AttachmentPreview } from './attachment-preview';
import { getModelName } from '@/utils/models';
import { Button } from '../ui/button';
import { GitBranch, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatMessage({
  message,
  isLastMessage,
  onBranch,
  isBranching,
}: {
  message: MessageType;
  isLastMessage: boolean;
  isBranching?: boolean;
  onBranch: () => void;
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
      <div
        className={cn('flex flex-col gap-2 w-full', {
          '[&_.chat-actions]:opacity-0 [&:hover_.chat-actions]:opacity-100':
            !isLastMessage,
        })}
      >
        {showLoading && (
          <div className="px-4">
            <Loader
              variant={message.reasoning ? 'text-shimmer' : 'typing'}
              text={message.reasoning ? 'Reasoning...' : ''}
            />
          </div>
        )}
        <AttachmentPreview attachments={message.attachments} preview />
        {isAssistant && (
          <>
            <div className="rounded-lg p-2 [&:has(pre)]:max-w-full max-w-[85%] sm:max-w-[75%] w-fit">
              <MessageContent
                className="bg-transparent leading-normal prose"
                markdown
              >
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
            {message?.status !== 'pending' && (
              <div
                className={cn(
                  'text-xs inline-flex items-center gap-0.5 text-muted-foreground animate-in fade-in duration-100 chat-actions px-2 -mt-4'
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBranch}
                  disabled={isBranching}
                >
                  <GitBranch />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="me-1"
                  onClick={() => {
                    if (!message?.content) {
                      toast.error('No content to copy');
                      return;
                    }
                    navigator.clipboard.writeText(message.content);
                    toast.success('Copied to clipboard');
                  }}
                >
                  <Copy />
                </Button>
                {getModelName(message.model)}
              </div>
            )}
          </>
        )}
        {!isAssistant && Boolean(message.content?.length) && (
          <MessageContent className="max-w-[85%] prose self-end sm:max-w-[75%] w-fit bg-foreground/5 p-4 border border-foreground/10 rounded-lg text-foreground/95">
            {message.content}
          </MessageContent>
        )}
      </div>
    </Message>
  );
}
