import { Skeleton } from '@/components/ui/skeleton';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { ChatNotFound } from '@/components/chat/chat-not-found';
import { ChatView } from '@/components/chat/chat-view';
import { ChatError } from '@/components/chat/chat-error';

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatPage,
  notFoundComponent: ChatNotFound,
  errorComponent: ChatError,
  pendingComponent: () => <Skeleton className="h-full w-full" />,
});

function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });

  return <ChatView chatId={chatId} />;
}
