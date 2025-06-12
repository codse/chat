import { Skeleton } from '@/components/ui/skeleton';
import {
  createFileRoute,
  Link,
  useParams,
  useRouterState,
} from '@tanstack/react-router';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessages } from '@/components/chat/chat-messages';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ChatProvider, useChatContext } from '@/components/chat/chat-context';
import { ShareIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { MessageSkeleton } from '@/components/chat/message-skeleton';

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatPage,
  notFoundComponent: () => (
    <div className="flex-1 h-full flex flex-col items-center justify-center">
      <div className="text-muted-foreground mb-4">
        The chat you are looking for does not exist.
      </div>
      <Button asChild>
        <Link to="/" className="text-sm text-muted-foreground">
          Start a new chat
        </Link>
      </Button>
    </div>
  ),
  pendingComponent: () => <Skeleton className="h-full w-full" />,
});

function ChatHeader() {
  const { chat } = useChatContext();
  const isLoading = !chat;
  return (
    <header className="py-4 w-full border-b border-border sticky z-10 chat-header flex px-4">
      <SidebarTrigger className="size-10" />
      <div className="flex flex-1 items-center gap-2 max-w-[var(--breakpoint-md)] mx-auto justify-between">
        {isLoading ? (
          <Skeleton className="h-6 w-40 mx-4" />
        ) : (
          <Button
            variant="link"
            className="text-foreground no-underline text-base"
            asChild
          >
            <Link to="/chat/$chatId" params={{ chatId: chat._id }}>
              {chat?.title}
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ShareIcon className="size-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });
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
      <ChatHeader />
      <Suspense fallback={<MessageSkeleton />}>
        <ChatMessages
          className={
            isLoading || isTransitioning ? 'opacity-50' : 'animate-in fade-in'
          }
          chatId={chatId}
          initialMessage={initialMessage}
        />
      </Suspense>
      <div className="px-4 max-w-[var(--breakpoint-md)] mx-auto w-full">
        <ChatInput chatId={chatId} defaultModel={model} />
      </div>
    </ChatProvider>
  );
}
