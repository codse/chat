import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useChatContext } from '@/components/chat/chat-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ChatShare from '@/components/chat/chat-share';
import { Id } from '@convex/_generated/dataModel';

export function ChatHeader({ chatId }: { chatId: Id<'chats'> }) {
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
            <Link to="/share/$chatId" params={{ chatId: chat._id }}>
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
