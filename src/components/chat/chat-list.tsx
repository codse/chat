import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { api } from '@convex/_generated/api';
import {
  UseMutateFunction,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { Link, useMatch, useNavigate } from '@tanstack/react-router';
import { MoreHorizontal, PencilIcon, PinIcon, TrashIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '@/types/chat';
import { Id } from '@convex/_generated/dataModel';

function ChatListItem({
  chat,
  isMobile,
  active,
  updateChatTitle,
  deleteChat,
  togglePin,
}: {
  chat: Chat;
  isMobile: boolean;
  active?: boolean;
  updateChatTitle: UseMutateFunction<
    null,
    Error,
    { chatId: Id<'chats'>; title: string },
    unknown
  >;
  deleteChat: UseMutateFunction<null, Error, { chatId: Id<'chats'> }, unknown>;
  togglePin: UseMutateFunction<null, Error, { chatId: Id<'chats'> }, unknown>;
}) {
  return (
    <SidebarMenuItem
      key={chat._id}
      className="relative group data-[state=open]:bg-accent"
    >
      <SidebarMenuButton asChild isActive={active}>
        <Link
          to={`/chat/$chatId`}
          params={{ chatId: chat._id }}
          state={{ chat }}
          className="w-full text-sm flex items-center gap-2 px-2 py-1.5"
        >
          <span className="line-clamp-1">{chat.title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal className="ml-auto" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={isMobile ? 'bottom' : 'right'}
              align={isMobile ? 'end' : 'start'}
              className="min-w-56 rounded-lg"
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => togglePin({ chatId: chat._id })}
              >
                <PinIcon />
                {chat.pinned ? 'Unpin chat' : 'Pin chat'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => deleteChat({ chatId: chat._id })}
              >
                <TrashIcon />
                Delete chat
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  updateChatTitle({ chatId: chat._id, title: 'Renamed chat' })
                }
              >
                <PencilIcon />
                Rename chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function ChatList({ mode }: { mode: 'pinned' | 'recent' }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.chats.queries.listChats, {
      mode,
      paginationOpts: {
        limit: 100,
        cursor: null,
      },
    })
  );

  const navigate = useNavigate();

  const { mutate: updateChatTitle } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.updateChatTitle),
  });

  const { mutate: deleteChat } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.deleteChat),
    onSuccess: () => {
      navigate({
        to: '/',
      });
    },
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.pinChat),
  });

  const match = useMatch({
    from: '/chat/$chatId',
    shouldThrow: false,
  });

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
            updateChatTitle={updateChatTitle}
            deleteChat={deleteChat}
            togglePin={togglePin}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
