import { Skeleton } from '../ui/skeleton';

export const ChatPageSkeleton = ({ noSideBar }: { noSideBar?: boolean }) => {
  return (
    <div className="grid h-full w-full grid-cols-[auto_1fr]">
      {noSideBar ? (
        <span />
      ) : (
        <div className="border-r h-full w-[calc(var(--spacing)*72)]">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      )}

      <div className="flex flex-col">
        <Skeleton className="h-[70px] border-b border-border bg-accent/25 w-full rounded-none" />
        <Skeleton className="flex-1 w-full bg-accent/50 rounded-none" />
      </div>
    </div>
  );
};
