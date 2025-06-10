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

function SideBarActions() {
  return (
    <div className="fixed top-1.5 left-1.5 z-50">
      <SidebarTrigger className="size-10" />
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <>
      <SideBarActions />
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="text-center">
              <Link to="/" className="max-w-fit inline-block text-transparent">
                Acme Chat
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Edit className="size-4" />
                  New chat
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
    </>
  );
}
