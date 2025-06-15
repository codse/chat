import { Chat } from '@/types/chat';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createContext, Suspense, useContext, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';

export const ChatContext = createContext<{
  chat?: Chat | null;
}>({});

export const useChatContext = () => {
  return useContext(ChatContext);
};

function LazyLoadChat({ chatId }: { chatId: Id<'chats'> }) {
  const navigate = useNavigate();

  const { data: chat } = useSuspenseQuery({
    ...convexQuery(api.chats.queries.getChat, {
      chatId: chatId,
    }),
  });

  const { data: user } = useSuspenseQuery({
    ...convexQuery(api.auth.getCurrentUser, {}),
  });

  useEffect(() => {
    if (
      user?._id !== null &&
      chat?.userId !== user?._id &&
      chat?.source !== 'share'
    ) {
      navigate({ to: '/', replace: true });
    }
  }, [user?._id, chat?.userId, chat?.source]);

  return null;
}

export function ChatProvider({
  children,
  chatId,
  className,
}: {
  children: React.ReactNode;
  chatId: string;
  className?: string;
}) {
  const navigate = useNavigate();

  const { data: chat } = useQuery({
    ...convexQuery(api.chats.queries.getChat, {
      chatId: chatId as Id<'chats'>,
    }),
    enabled: false,
  });

  useEffect(() => {
    // Should never happen, but just in case.
    if (chat?.type === 'private' || chat?.type === 'deleted') {
      navigate({
        to: '/',
      });
    }
  }, [chat?.type]);

  return (
    <ChatContext.Provider value={{ chat }}>
      <div className={cn(className)}>{children}</div>
      <Suspense>
        <LazyLoadChat chatId={chatId as Id<'chats'>} />
      </Suspense>
    </ChatContext.Provider>
  );
}
