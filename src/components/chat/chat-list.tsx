import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { api } from '@convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { Link, useMatch } from '@tanstack/react-router';
import { useSidebar } from '../ui/sidebar';
import { ChatListItem } from './chat-list-item';

export function ChatList({ mode }: { mode: 'pinned' | 'recent' }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.chats.queries.listChats, {
      mode,
    })
  );

  const shareMatch = useMatch({
    from: '/share/$chatId',
    shouldThrow: false,
  });

  const chatMatch = useMatch({
    from: '/chat/$chatId',
    shouldThrow: false,
  });

  const match = shareMatch || chatMatch;

  const { isMobile } = useSidebar();
  const chats = data?.chats;

  if (!chats?.length) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        {mode === 'pinned' ? 'Pinned' : 'Recent'}
      </SidebarGroupLabel>
      <SidebarMenu className="ps-2">
        {chats?.map((chat) => (
          <ChatListItem
            key={chat._id}
            chat={chat}
            isMobile={isMobile}
            active={match?.params?.chatId === chat._id}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
