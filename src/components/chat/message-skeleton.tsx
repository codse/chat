import { Skeleton } from '../ui/skeleton';

export function MessageSkeleton() {
  return (
    <div className="flex flex-col px-4 gap-4 w-full h-full flex-1 py-4 mx-auto max-w-[var(--breakpoint-md)]">
      <Skeleton className="h-16 w-full max-w-md ms-auto" />
      <Skeleton className="h-12 w-full max-w-md bg-muted/50" />
      <Skeleton className="h-8 w-full max-w-sm ms-auto" />
      <Skeleton className="h-20 w-full max-w-md bg-muted/50" />
    </div>
  );
}
