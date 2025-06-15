import { useRouterState } from '@tanstack/react-router';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessages } from '@/components/chat/chat-messages';
import { Suspense } from 'react';
import { ChatProvider } from '@/components/chat/chat-context';
import { MessageSkeleton } from '@/components/chat/message-skeleton';
import { Id } from '@convex/_generated/dataModel';
import { ChatHeader } from '@/components/chat/chat-header';

export function ChatView({ chatId }: { chatId: string }) {
  const { location, isLoading, isTransitioning } = useRouterState();
  const initialMessage = location.state?.message;
  const chat = location.state?.chat;
  const model = chat?.model || initialMessage?.model;

  return (
    <ChatProvider
      key={chatId}
      chatId={chatId}
      className="flex-1 flex flex-col h-full bg-background absolute w-full overflow-hidden"
    >
      <ChatHeader chatId={chatId as Id<'chats'>} />
      <Suspense fallback={<MessageSkeleton />}>
        <ChatMessages
          className={
            isLoading || isTransitioning ? 'opacity-50' : 'animate-in fade-in'
          }
          chatId={chatId}
          initialMessage={initialMessage}
          referenceId={location.state?.referenceId}
        />
      </Suspense>
      <div className="px-4 max-w-[var(--breakpoint-md)] mx-auto w-full">
        <ChatInput chatId={chatId} defaultModel={model} />
      </div>
    </ChatProvider>
  );
}
