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
    <header className="py-4 w-full border-b border-border sticky z-10 chat-header flex px-4">
      <SidebarTrigger className="size-10 absolute left-4 top-1/2 -translate-y-1/2" />
      <div className="flex flex-1 items-center gap-2 max-w-[var(--breakpoint-md)] mx-auto justify-between px-4">
        {isLoading ? (
          <Skeleton className="h-6 w-40 mx-4" />
        ) : (
          <Button
            variant="link"
            className="text-foreground no-underline text-base"
            asChild
          >
            <Link
              to={isSharedChat ? '/share/$chatId' : '/chat/$chatId'}
              params={{ chatId: chat._id }}
            >
              {chat?.title}
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <ChatShare chatId={chatId} />
        </div>
      </div>
    </header>
  );
}
