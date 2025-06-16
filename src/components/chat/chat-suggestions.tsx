import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { cn } from '@/lib/utils';
import { BookIcon, CodeIcon, PenIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { kOpenNewChat } from './event.utils';

const suggestions = {
  create: [
    'Create a fantasy world map with flying islands and glowing rivers',
    'Generate a professional email apologizing for a missed meeting',
    'Design a modern logo for a fictional AI startup named "NeuroNest"',
    'Create a new chat to brainstorm sci-fi story ideas',
    'Create an image of a neon-lit street in Tokyo during a rainstorm',
  ],
  explore: [
    'Explore the psychological effects of social media on teenagers',
    'What would happen if Earth had two moons?',
    'How do different cultures celebrate the New Year?',
    'Explore why cats purr and what it means',
    'Dive into the daily life of an ancient Roman citizen',
  ],
  code: [
    'Build a REST API with Express.js and MongoDB for a todo app',
    'Explain how closures work in JavaScript with examples',
    'Write a Python function to detect palindromes using recursion',
    'Compare performance of useMemo vs useCallback in React',
    'Generate unit tests for a user login function in TypeScript',
  ],
  learn: [
    'Teach me the basics of quantum computing like I’m 10',
    'Learn the differences between machine learning and deep learning',
    'Summarize World War I in 10 bullet points',
    'Learn how inflation affects everyday life with simple examples',
    'Explain the fundamentals of blockchain in 5 minutes',
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
      className="flex w-fit max-w-xl px-4 flex-col space-y-4 mx-auto flex-1 justify-center animate-in fade-in-60 zoom-in-90"
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
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="flex w-full max-w-fit gap-2 rounded-lg bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            key={option}
            onClick={() => onSuggestionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
