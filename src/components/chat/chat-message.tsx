'use client';

import { Markdown } from '@/components/ui/markdown';
import { Message, MessageContent } from '@/components/ui/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '../ui/reasoning';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Message as MessageType } from '@/types/chat';
import { AttachmentPreview } from './attachment-preview';
import { getModelName } from '@/utils/models';
import { Button } from '../ui/button';
import { Split, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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
        'min-h-[calc(100dvh-280px)]': isLastMessage,
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
            <div className="rounded-lg p-2 [&:has(pre)]:max-w-full max-w-[85%]">
              <MessageContent className="bg-transparent" markdown>
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
                  <ReasoningContent>
                    <Markdown>{message.reasoning as string}</Markdown>
                  </ReasoningContent>
                </Reasoning>
              )}
            </div>
            {message?.status !== 'pending' && (
              <div
                className={cn(
                  'text-xs inline-flex items-center gap-0 text-muted-foreground chat-actions px-2',
                  {
                    '-mt-4': Boolean(message.content),
                  }
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!message?.content) {
                          toast.error('No content to copy');
                          return;
                        }
                        navigator.clipboard.writeText(message.content);
                        toast.success('Copied to clipboard');
                      }}
                      className="animate-in fade-in duration-100 zoom-in-90"
                    >
                      <Copy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy message</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onBranch}
                      className="me-2 animate-in fade-in duration-200 zoom-in-90"
                      disabled={isBranching}
                    >
                      <Split className="size-4 rotate-180" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Branch from this message</TooltipContent>
                </Tooltip>
                <span className="animate-in fade-in duration-300 zoom-in-90">
                  {getModelName(message.model)}
                </span>
              </div>
            )}
          </>
        )}
        {!isAssistant && Boolean(message.content?.length) && (
          <MessageContent className="max-w-[85%] prose self-end sm:max-w-[75%] w-fit p-4 border border-foreground/10 rounded-lg user-message">
            {message.content}
          </MessageContent>
        )}
      </div>
    </Message>
  );
}
