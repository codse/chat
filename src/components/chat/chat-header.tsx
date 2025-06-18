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
    from: '/share/$chatId',
    shouldThrow: false,
  });
  const isSharedChat = Boolean(match);
  return (
    <header className="py-4 w-full border-b border-border chat-header sticky top-0 z-40">
      <SidebarTrigger className="size-10 absolute left-2 md:left-4 top-1/2 -translate-y-1/2" />
      <div className="grid grid-cols-[32px_1fr_auto] items-center gap-4 max-w-[var(--breakpoint-md)] mx-auto px-4">
        <span />
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
