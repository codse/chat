import { createFileRoute, useSearch } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ChatSuggestions } from '@/components/chat/chat-suggestions';
import { ChatInput } from '@/components/chat/chat-input';
import { useState } from 'react';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import { LocalStorage } from '@/utils/local-storage';

export const Route = createFileRoute('/_app/')({
  component: Chat,
  pendingComponent: () => (
    <div className="grid h-full w-full grid-cols-[auto_1fr]">
      <div className="border-r h-full w-[calc(var(--spacing)*72)]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <Skeleton className="h-screen w-full bg-muted-foreground/5 rounded-none">
        <div className="flex w-fit max-w-xl px-4 flex-col space-y-4 mx-auto flex-1 justify-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </Skeleton>
    </div>
  ),
  validateSearch: zodValidator(
    z.object({
      model: z.string().optional(),
    })
  ),
});

function Chat() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>();
  const searchParams = useSearch({ from: '/_app/', shouldThrow: false });

  return (
    <div className="flex flex-1 flex-col relative">
      <SidebarTrigger className="absolute top-4 left-4 bg-accent md:invisible" />
      <div className="@container/main flex flex-1 flex-col gap-2 [data-state=collapsed]:hidden">
        <ChatSuggestions onSuggestionClick={setSelectedSuggestion} />
      </div>
      <div className="px-4 max-w-[var(--breakpoint-md)] mx-auto w-full">
        <ChatInput
          defaultPrompt={selectedSuggestion}
          key={selectedSuggestion}
          // If the model is set in the search params, use it
          // Otherwise, use the model from the local storage
          initialModel={searchParams?.model || LocalStorage.model.get()}
        />
      </div>
    </div>
  );
}
