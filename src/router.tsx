import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import {
  MutationCache,
  QueryClient,
  notifyManager,
} from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { toast } from 'sonner';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { routeTree } from './routeTree.gen';
import { Doc, Id } from '@convex/_generated/dataModel';

const DefaultCatchBoundary = () => <div>DefaultCatchBoundary</div>;
const NotFound = () => <div>NotFound</div>;

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
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
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
    // After sending a message in a shared chat, we want to display a system message after this referenceId.
    referenceId?: Id<'messages'> | null;
    chat?: Pick<Doc<'chats'>, '_id' | 'model' | 'title'> | null;
  }
}
