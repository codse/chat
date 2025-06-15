import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { api } from '@convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { Link, useMatch } from '@tanstack/react-router';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '@/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  GitBranch,
  MoreHorizontal,
  PencilIcon,
  PinIcon,
  TrashIcon,
} from 'lucide-react';
import { performAction } from './utils';
import { useState } from 'react';
import { Input } from '../ui/input';

function ChatListItemRename({
  chat,
  onDone,
}: {
  chat: Chat;
  onDone: (title: string) => void;
}) {
  const [title, setTitle] = useState(chat.title);

  return (
    <Input
      autoFocus
      value={title}
      onChange={(e) => {
        setTitle(e.target.value);
      }}
      onFocus={(e) => {
        e.target.setSelectionRange(title.length, title.length);
        e.target.select();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          performAction('rename', {
            ...chat,
            title,
          });
          onDone(title);
        }
      }}
      className="px-2 py-1.5 m-0 w-full h-full border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
      onBlur={() => {
        performAction('rename', {
          ...chat,
          title,
        });
        onDone(title);
      }}
    />
  );
}

function ChatListItemLink({
  chat,
  isMobile,
  onEditClick,
  title,
}: {
  chat: Chat;
  isMobile: boolean;
  onEditClick: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      {chat.source === 'branch' && <GitBranch className="size-3 shrink-0" />}
      <span className="line-clamp-1">{title}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover className="right-2 px-2">
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
            onClick={() => {
              performAction('pin', chat);
            }}
          >
            <PinIcon />
            {chat?.pinned ? 'Unpin chat' : 'Pin chat'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(event) => {
              if (!chat?._id) {
                return;
              }

              event.stopPropagation();
              performAction('delete', chat);
            }}
          >
            <TrashIcon />
            Delete chat
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
          >
            <PencilIcon />
            Rename chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ChatListItem({
  chat,
  isMobile,
  active,
}: {
  chat: Chat;
  isMobile: boolean;
  active?: boolean;
}) {
  const [{ isEditing, localTitle }, setIsEditing] = useState({
    isEditing: false,
    localTitle: '',
  });

  return (
    <SidebarMenuItem
      key={chat._id}
      className="relative group data-[state=open]:bg-accent"
    >
      <SidebarMenuButton
        asChild
        isActive={active}
        onClick={() => {
          if (!isEditing) {
            setIsEditing({
              isEditing: true,
              localTitle: chat.title,
            });
          }
        }}
      >
        <Link
          to={`/chat/$chatId`}
          params={{ chatId: chat._id }}
          state={{ chat }}
          className="w-full text-sm px-0 py-0"
        >
          {isEditing ? (
            <ChatListItemRename
              chat={chat}
              onDone={(title) => {
                setIsEditing({
                  isEditing: false,
                  localTitle: title,
                });
              }}
            />
          ) : (
            <ChatListItemLink
              chat={chat}
              title={localTitle || chat.title}
              isMobile={isMobile}
              onEditClick={() =>
                setIsEditing({
                  isEditing: true,
                  localTitle: chat.title,
                })
              }
            />
          )}
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
