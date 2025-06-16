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
import { Edit, SearchIcon, KeyRound, BadgeCheck } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from './ui/skeleton';
import { openNewChat } from './chat/utils';
import BYOKDialog from './byok-dialog';
import { BYOKStorage } from '@/utils/byok-storage';
import { Button } from './ui/button';

const ChatListItemActions = React.lazy(
  () => import('./chat/chat-list-item-actions')
);

const SideBarUser = React.lazy(() => import('./nav-user'));

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const [byokOpen, setByokOpen] = React.useState(false);
  const [hasKeys, setHasKeys] = React.useState(false);

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

  React.useEffect(() => {
    const keys = BYOKStorage.get();
    setHasKeys(Boolean(keys.openai || keys.openrouter));
  }, [byokOpen]);

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
              <SidebarMenuButton className="mt-2">
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
        <div className="mb-2 flex flex-col gap-2">
          <Button
            className="flex py-8 items-center gap-2 px-2 h-unset rounded hover:bg-muted transition text-xs border border-border"
            onClick={() => setByokOpen(true)}
            variant="secondary"
          >
            {hasKeys ? (
              <>
                <BadgeCheck className="size-4 text-green-800" />
                <span>Manage API keys</span>
              </>
            ) : (
              <>
                <KeyRound className="size-4" />
                <span className="text-muted-foreground">Add API keys</span>
              </>
            )}
          </Button>
          <BYOKDialog open={byokOpen} onOpenChange={setByokOpen} />
        </div>
        <Suspense fallback={<Skeleton className="h-12 w-full rounded-sm" />}>
          <SideBarUser />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
