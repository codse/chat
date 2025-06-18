import { Skeleton } from '../ui/skeleton';

export const ChatPageSkeleton = () => {
  return (
    <div className="grid h-full w-full grid-cols-[auto_1fr]">
      <div className="border-r h-full w-[calc(var(--spacing)*72)]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="flex flex-col gap-2 px-2">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="flex-1 w-full bg-accent/50 rounded-none" />
      </div>
    </div>
  );
};
