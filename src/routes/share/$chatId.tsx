import { Skeleton } from '@/components/ui/skeleton';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { ChatNotFound } from '@/components/chat/chat-not-found';
import { ChatView } from '@/components/chat/chat-view';

export const Route = createFileRoute('/share/$chatId')({
  component: ChatPage,
  notFoundComponent: ChatNotFound,
  pendingComponent: () => <Skeleton className="h-full w-full" />,
});

function ChatPage() {
  const { chatId } = useParams({ from: '/share/$chatId' });

  return <ChatView chatId={chatId} />;
}
