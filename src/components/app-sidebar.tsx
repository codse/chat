'use client';

import * as React from 'react';
import { ChatList } from '@/components/chat/chat-list';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { Edit, SearchIcon } from 'lucide-react';
import { Suspense } from 'react';

const ChatListItemActions = React.lazy(
  () => import('./chat/chat-list-item-actions')
);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="text-center">
            <Link
              to="/"
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
              <SidebarMenuButton asChild>
                <Link to="/" preload="intent">
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
        <NavUser
          user={{
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatar: 'https://github.com/shadcn.png',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
