import { Skeleton } from '@/components/ui/skeleton';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { ChatNotFound } from '@/components/chat/chat-not-found';
import { ChatView } from '@/components/chat/chat-view';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatPage,
  notFoundComponent: ChatNotFound,
  errorComponent: () => {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">
          There was an error loading this chat.
        </div>
        <Button asChild variant="outline">
          <Link to="/" replace>
            Go back to home page
          </Link>
        </Button>
      </div>
    );
  },
  pendingComponent: () => <Skeleton className="h-full w-full" />,
});

function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });

  return <ChatView chatId={chatId} />;
}
