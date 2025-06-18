import { createFileRoute, useParams } from '@tanstack/react-router';
import { ChatNotFound } from '@/components/chat/chat-not-found';
import { ChatView } from '@/components/chat/chat-view';
import { ChatError } from '@/components/chat/chat-error';
import { ChatPageSkeleton } from '@/components/chat/page-skeleton';

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatPage,
  notFoundComponent: ChatNotFound,
  errorComponent: ChatError,
  pendingComponent: () => <ChatPageSkeleton />,
});

function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });

  return <ChatView chatId={chatId} />;
}
