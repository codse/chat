'use client';

import * as React from 'react';
import { ChatList } from '@/components/chat/chat-list';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, useNavigate } from '@tanstack/react-router';
import { Edit, SearchIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from './ui/skeleton';
import { openNewChat } from './chat/utils';

const ChatListItemActions = React.lazy(
  () => import('./chat/chat-list-item-actions')
);

const SideBarUser = React.lazy(() => import('./nav-user'));

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'o' &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        navigate({ to: '/' });
        openNewChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="text-center">
            <Link
              to="/"
              onClick={openNewChat}
              className="max-w-fit inline-block px-2 py-4 font-bold text-primary"
            >
              Fast Chat
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="text-md h-fit items-center flex  justify-center gap-2 border box-border"
              >
                <Link to="/" onClick={openNewChat}>
                  <Edit className="size-4" />
                  New chat
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <SearchIcon className="size-4" />
                Search chats
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <Suspense>
          <ChatList mode="pinned" />
        </Suspense>
        <Suspense>
          <ChatList mode="recent" />
        </Suspense>
        <Suspense>
          <ChatListItemActions />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<Skeleton className="h-8 w-full rounded-sm" />}>
          <SideBarUser />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
