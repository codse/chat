import * as React from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { SearchIcon, ArchiveIcon, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';

export default function SidebarSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery] = useDebounce(query, 200);

  const { data, isFetching } = useQuery(
    convexQuery(api.chats.queries.searchChats, { query: debouncedQuery.trim() })
  );

  return (
    <>
      <SidebarMenuButton className="mt-2" onClick={() => setOpen(true)}>
        <SearchIcon className="size-4" />
        Search chats
      </SidebarMenuButton>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Find your chats by title."
        className="min-h-64"
      >
        <CommandInput
          placeholder="Search chats..."
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <CommandList>
          <CommandEmpty>
            {isFetching ? (
              <div className="flex items-center gap-2 justify-center w-full">
                <Loader2 className="size-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              'No chats found.'
            )}
          </CommandEmpty>
          {data?.map((chat) => (
            <CommandItem
              key={chat._id}
              value={`${chat._id} ${chat.title}`}
              onSelect={() => {
                setOpen(false);
              }}
              asChild
              className="flex items-center gap-2 rounded-none bg-white"
            >
              <Link to={`/chat/$chatId`} params={{ chatId: chat._id }}>
                <span className="truncate flex-1">{chat.title}</span>
                {chat.type === 'archived' && (
                  <Badge
                    variant="outline"
                    className="ml-2 flex items-center gap-1 text-xs"
                  >
                    <ArchiveIcon className="size-3" /> archived
                  </Badge>
                )}
              </Link>
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
