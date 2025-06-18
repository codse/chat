import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { cn } from '@/lib/utils';
import { BookIcon, CodeIcon, PenIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { kOpenNewChat } from './event.utils';

const suggestions = {
  create: [
    "Design a time travel agency's vacation packages to different eras",
    "Write a recipe for the world's most ridiculous sandwich",
    'Create a new sport that combines chess and parkour',
    'Invent a fictional holiday and its bizarre traditions',
    'Design a theme park for cats, run by cats',
  ],
  explore: [
    'What if humans could photosynthesize like plants?',
    'Explore how animals would evolve if gravity was half as strong',
    'What would happen if everyone suddenly spoke in rhymes?',
    'Investigate the secret lives of household appliances',
    'What if clouds were made of different flavors?',
  ],
  code: [
    'Build a program that translates human speech into dog thoughts',
    'Create a dating app for programming languages',
    'Write an algorithm to calculate the perfect nap duration',
    'Design a social network for time travelers',
    'Make a compiler that turns code into haiku poetry',
  ],
  learn: [
    'Explain black holes using only pizza analogies',
    'Learn why flamingos stand on one leg like a detective solving a case',
    'Describe the internet to a medieval knight',
    'Explain DNA using only emoji',
    'Learn about the physics of superhero powers',
  ],
} as const;

const quickActions: {
  key: keyof typeof suggestions;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: 'create', label: 'Create', icon: <PenIcon className="size-4" /> },
  { key: 'explore', label: 'Explore', icon: <SearchIcon className="size-4" /> },
  { key: 'code', label: 'Code', icon: <CodeIcon className="size-4" /> },
  { key: 'learn', label: 'Learn', icon: <BookIcon className="size-4" /> },
] as const;

export function ChatSuggestions({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof suggestions | null
  >(null);

  const handleSuggestionClick = (suggestion: keyof typeof suggestions) => {
    setSelectedCategory(suggestion);
  };

  const options = suggestions[selectedCategory ?? 'create'];
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handleOpenNewChat: EventListener = () => {
      setKey((k) => k + 1);
    };

    window.addEventListener(kOpenNewChat, handleOpenNewChat);
    return () => {
      window.removeEventListener(kOpenNewChat, handleOpenNewChat);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex w-full max-w-xl px-4 flex-col space-y-4 mx-auto flex-1 justify-center',
        {
          'animate-in fade-in-60 zoom-in-90': key > 0,
        }
      )}
      key={`suggestions-${key}`}
    >
      <div className="flex flex-wrap gap-2 px-2">
        {quickActions.map((action) => (
          <PromptSuggestion
            key={action.key}
            onClick={() => handleSuggestionClick(action.key)}
            className={cn({
              'bg-accent': selectedCategory === action.key,
            })}
          >
            {action.icon}
            {action.label}
          </PromptSuggestion>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            className="flex w-full text-left max-w-fit gap-2 rounded-lg bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            key={option}
            onClick={() => onSuggestionClick(option + ' ')}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
