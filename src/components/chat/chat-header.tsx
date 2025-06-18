import { Skeleton } from '@/components/ui/skeleton';
import { Link, useMatch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useLazyChatContext } from '@/components/chat/chat-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ChatShare from '@/components/chat/chat-share';
import { Id } from '@convex/_generated/dataModel';

export function ChatHeader({ chatId }: { chatId: Id<'chats'> }) {
  const { chat } = useLazyChatContext();
  const isLoading = !chat;
  const match = useMatch({
    from: '/_app/share/$chatId',
    shouldThrow: false,
  });
  const isSharedChat = Boolean(match);
  return (
    <header className="py-4 w-full border-b border-border flex flex-row items-center chat-header sticky top-0 z-40">
      <SidebarTrigger className="size-10 ms-4" />
      <div className="grid grid-cols-[1fr_auto] flex-1 w-full md:grid-cols-[1fr_auto] items-center gap-4 max-w-[var(--breakpoint-md)] mx-auto px-4">
        {isLoading ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          <Button
            variant="link"
            className="text-foreground truncate text-base no-underline justify-start px-0"
            asChild
          >
            <Link
              to={isSharedChat ? '/share/$chatId' : '/chat/$chatId'}
              params={{ chatId: chat._id }}
            >
              <span className="truncate">{chat?.title}</span>
            </Link>
          </Button>
        )}

        <div className="flex items-center">
          <ChatShare chatId={chatId} />
        </div>
      </div>
    </header>
  );
}
