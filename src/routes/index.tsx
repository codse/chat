import { createFileRoute } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ChatSuggestions } from '@/components/chat/chat-suggestions';
import { ChatInput } from '@/components/chat/chat-input';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Chat,
  pendingComponent: () => <Skeleton />,
});

function Chat() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>();
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="sidebar" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 [data-state=collapsed]:hidden">
            <ChatSuggestions onSuggestionClick={setSelectedSuggestion} />
          </div>
          <div className="px-4 max-w-[var(--breakpoint-md)] mx-auto w-full">
            <ChatInput
              defaultPrompt={selectedSuggestion}
              key={selectedSuggestion}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
