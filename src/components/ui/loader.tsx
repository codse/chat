'use client';

import { cn } from '@/lib/utils';

export interface LoaderProps {
  variant?: 'typing' | 'wave' | 'text-shimmer';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function TypingLoader({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dotSizes = {
    sm: 'h-1 w-1',
    md: 'h-1.5 w-1.5',
    lg: 'h-2 w-2',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-1',
        containerSizes[size],
        className
      )}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary animate-[typing_1s_infinite] rounded-full',
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 250}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function WaveLoader({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const barWidths = {
    sm: 'w-0.5',
    md: 'w-0.5',
    lg: 'w-1',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  const heights = {
    sm: ['6px', '9px', '12px', '9px', '6px'],
    md: ['8px', '12px', '16px', '12px', '8px'],
    lg: ['10px', '15px', '20px', '15px', '10px'],
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        containerSizes[size],
        className
      )}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary animate-[wave_1s_ease-in-out_infinite] rounded-full',
            barWidths[size]
          )}
          style={{
            animationDelay: `${i * 100}ms`,
            height: heights[size][i],
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TextShimmerLoader({
  text = 'Thinking',
  className,
  size = 'md',
}: {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'bg-[linear-gradient(to_right,var(--muted-foreground)_40%,var(--foreground)_60%,var(--muted-foreground)_80%)]',
        'bg-size-[200%_auto] bg-clip-text font-medium text-transparent',
        'animate-[shimmer_4s_infinite_linear]',
        textSizes[size],
        className
      )}
    >
      {text}
    </div>
  );
}

function Loader({
  variant = 'typing',
  size = 'md',
  text,
  className,
}: LoaderProps) {
  switch (variant) {
    case 'typing':
      return <TypingLoader size={size} className={className} />;
    case 'wave':
      return <WaveLoader size={size} className={className} />;
    case 'text-shimmer':
      return (
        <TextShimmerLoader text={text} size={size} className={className} />
      );
    default:
      return <WaveLoader size={size} className={className} />;
  }
}

export { Loader };
