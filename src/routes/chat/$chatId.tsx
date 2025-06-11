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
  pendingComponent: () => <Skeleton />,
});

function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });
  const { location, isLoading, isTransitioning } = useRouterState();
  const initialMessage = location.state?.message?.content;

  return (
    <div className="flex-1 flex flex-col h-full absolute w-full overflow-hidden">
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <ChatMessages
          className={
            isLoading || isTransitioning ? 'opacity-50' : 'animate-in fade-in'
          }
          chatId={chatId}
          initialMessage={initialMessage}
        />
      </Suspense>
      <div className="px-4">
        <ChatInput chatId={chatId} />
      </div>
    </div>
  );
}
