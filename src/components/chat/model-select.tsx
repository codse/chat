import * as React from 'react';
import { ChevronsUpDownIcon } from 'lucide-react';
import {
  BrainCircuit,
  File,
  Search,
  ImageIcon,
  MessageSquareText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { modelsList } from '@/utils/models';

const capabilityIcons = {
  vision: ImageIcon,
  file: File,
  text: MessageSquareText,
  search: Search,
  reasoning: BrainCircuit,
};

function ModelSelectItem({
  model,
  onSelect,
}: {
  model: (typeof modelsList)[number];
  onSelect: () => void;
}) {
  return (
    <CommandItem
      key={model.id}
      value={model.id}
      className="flex items-start flex-col py-2"
      onSelect={onSelect}
    >
      <span className="font-semibold">{model.name}</span>
      <div className="flex gap-2 justify-between flex-1 w-full">
        <span className="text-muted-foreground text-xs">
          by {model.provider}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {model.supports.map((capability) => {
            const Icon = capabilityIcons[capability];
            return <Icon key={capability} className="size-3.5" />;
          })}
        </div>
      </div>
    </CommandItem>
  );
}

export function ModelSelect({
  label,
  onValueChange,
}: {
  label: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="max-w-[250px] w-fit justify-between border-none text-xs text-muted-foreground py-0 font-semibold px-0 shadow-none"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {modelsList.map((model) => (
                <ModelSelectItem
                  onSelect={() => {
                    onValueChange(model.id);
                    setOpen(false);
                  }}
                  key={model.id}
                  model={model}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
