import { Chat } from '@/types/chat';
import { convexQuery, useConvexQuery } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';

export const ChatContext = createContext<{
  chat?: Chat | null;
}>({});

export const useChatContext = () => {
  return useContext(ChatContext);
};

function LazyLoadChat({ chatId }: { chatId: Id<'chats'> }) {
  useSuspenseQuery({
    ...convexQuery(api.chats.queries.getChat, {
      chatId: chatId,
    }),
  });

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
    if (chat?.deleteTime) {
      navigate({
        to: '/',
      });
    }
  }, [chat?.deleteTime]);

  return (
    <ChatContext.Provider value={{ chat }}>
      <div className={cn(className)}>{children}</div>
      <Suspense>
        <LazyLoadChat chatId={chatId as Id<'chats'>} />
      </Suspense>
    </ChatContext.Provider>
  );
}
