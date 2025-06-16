import * as React from 'react';
import { ChevronsUpDownIcon, Info } from 'lucide-react';
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
import { recommendedModelList } from '@/utils/models';
import { Skeleton } from '../ui/skeleton';
import { useAppContext } from '@/context/app-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { isModelEnabled } from './chat.utils';
import { LocalStorage } from '@/utils/local-storage';

const capabilityIcons = {
  vision: ImageIcon,
  file: File,
  search: Search,
  reasoning: BrainCircuit,
};

function ModelSelectItem({
  model,
  onSelect,
  disabled,
}: {
  model: (typeof recommendedModelList)[number];
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <CommandItem
      key={model.id}
      value={model.id}
      className={`flex items-start flex-col py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onSelect={() => {
        if (disabled) {
          return;
        }

        onSelect();
        // Remember user's choice so that we can use it as preferred model in new chat.
        // However, search params' model will take precedence.
        LocalStorage.model.set(model.id);
      }}
    >
      <h5 className="font-semibold flex items-center justify-between gap-2 w-full">
        {model.name}
        {disabled && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-4 text-yellow-700" />
            </TooltipTrigger>

            <TooltipContent>
              <span className="text-xs">
                {model.id.includes('openai/')
                  ? 'OpenAI API key required'
                  : 'OpenRouter API key required'}
              </span>
            </TooltipContent>
          </Tooltip>
        )}
      </h5>
      <div className="flex gap-2 justify-between flex-1 w-full">
        <i className="text-muted-foreground text-xs">{model.provider}</i>
        <div className="flex items-center gap-1 ml-auto">
          {model.supports.map((capability) => {
            const Icon =
              capabilityIcons[capability as keyof typeof capabilityIcons];
            if (!Icon) {
              return null;
            }

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
  showLoading,
}: {
  label: string;
  onValueChange: (value: string) => void;
  showLoading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { userKeys: byokKeys } = useAppContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="max-w-[250px] w-fit justify-between border-none text-xs text-muted-foreground py-0 font-semibold px-0 shadow-none"
        >
          <span className="truncate">
            {showLoading ? <Skeleton className="h-4 w-20" /> : label}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {recommendedModelList.map((model) => (
                <ModelSelectItem
                  onSelect={() => {
                    if (isModelEnabled(model, byokKeys)) {
                      onValueChange(model.id);
                      setOpen(false);
                    }
                  }}
                  key={model.id}
                  model={model}
                  disabled={!isModelEnabled(model, byokKeys)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
