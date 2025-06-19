'use client';

import React, { Fragment, Suspense } from 'react';
import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/ui/chat-container';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { ScrollButton } from '../ui/scroll-button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { SystemMessage } from './system-message';
import ChatMessage from './chat-message';
import { LocalStorage } from '@/utils/local-storage';

export function ChatMessages({
  chatId,
  initialMessage,
  className,
  referenceId,
}: {
  chatId: string;
  initialMessage?: Doc<'messages'> | null;
  className?: string;
  referenceId?: Id<'messages'> | null;
}) {
  const { data: messages } = useSuspenseQuery({
    ...convexQuery(api.messages.queries.getChatMessages, {
      chatId: chatId as Id<'chats'>,
    }),
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    staleTime: 15 * 1000,
    gcTime: 30 * 1000,
    initialData: initialMessage ? [initialMessage] : [],
  });

  const navigate = useNavigate();
  const {
    mutate: createBranch,
    isPending: isCreatingBranch,
    variables: branchVariables,
  } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.branchChat),

    onSuccess: (newChatId?: string) => {
      if (!newChatId) {
        toast.error('Failed to branch chat');
        return;
      }
      if (branchVariables?.model) {
        LocalStorage.currentModel.set(branchVariables.model);
      }

      navigate({
        to: '/chat/$chatId',
        params: {
          chatId: newChatId,
        },
      });
    },
    onError: (error) => {
      toast.error('Failed to branch chat');
      console.error(error);
    },
  });

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
            <Fragment key={message._id}>
              <SystemMessage visible={message._id === referenceId} />
              <ChatMessage
                message={message}
                isLastMessage={index === messages.length - 1}
                isBranching={
                  isCreatingBranch && branchVariables?.messageId === message._id
                }
                onBranch={() => {
                  if (!isCreatingBranch) {
                    createBranch({
                      chatId: chatId as Id<'chats'>,
                      model: message.model,
                      messageId: message._id,
                    });
                    return;
                  }
                }}
              />
            </Fragment>
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
