import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import {
  MutationCache,
  QueryClient,
  notifyManager,
} from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { toast } from 'sonner';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexReactClient } from 'convex/react';
import { routeTree } from './routeTree.gen';
import { Doc } from '@convex/_generated/dataModel';
import { lazy } from 'react';
import { Skeleton } from './components/ui/skeleton';

const LazyErrorPage = lazy(() => import('@/components/error'));
const LazyNotFoundPage = lazy(() => import('@/components/not-found'));

export function createRouter() {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

  if (!CONVEX_URL) {
    console.error('missing envar CONVEX_URL');
  }

  const convex = new ConvexReactClient(CONVEX_URL!, {
    verbose: true,
  });
  const convexQueryClient = new ConvexQueryClient(convex, {
    verbose: true,
  });

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  });

  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      defaultErrorComponent: LazyErrorPage,
      defaultNotFoundComponent: LazyNotFoundPage,
      defaultPendingComponent: () => (
        <div className="grid h-full w-full grid-cols-[auto_1fr]">
          <div className="border-r h-full w-[calc(var(--spacing)*72)]">
            <Skeleton className="h-full w-full rounded-none" />
          </div>

          <Skeleton className="h-screen w-full bg-muted-foreground/5 rounded-none" />
        </div>
      ),
      context: {
        queryClient,
        convexQueryClient,
      },
      scrollRestoration: true,
    }),
    queryClient
  );

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }

  interface HistoryState {
    message?: Doc<'messages'> | null;
    // After sending a message in a shared chat, we want to display a system message after the message?.id.
    fromSharedChat?: boolean;
  }
}
