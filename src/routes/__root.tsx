import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouteContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { Toaster } from 'sonner';
import type { QueryClient } from '@tanstack/react-query';
import appCss from '../styles/app.css?url';
import { seo } from '@/utils/seo';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
} from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth(getWebRequest() as Request);
  const token = await auth.getToken({ template: 'convex' });

  return {
    userId: auth.userId,
    token,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Chat with AI',
        description: `Chat with AI`,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <div>Error</div>
      </RootDocument>
    );
  },
  notFoundComponent: () => <div>Not Found</div>,
  // beforeLoad: async (ctx) => {
  //   const time = performance.now();
  //   const auth = await fetchClerkAuth();
  //   const { userId, token } = auth;

  //   // During SSR only (the only time serverHttpClient exists),
  //   // set the Clerk auth token to make HTTP queries with.
  //   if (token) {
  //     ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
  //   }
  //   console.log(`Clerk auth took ${performance.now() - time}ms`);

  //   return {
  //     userId,
  //     token,
  //   };
  // },
  // loader: async (ctx) => {
  //   const time = performance.now();
  //   const auth = await fetchClerkAuth();
  //   const { userId, token } = auth;
  //   console.log(`Clerk auth took ${performance.now() - time}ms`);
  // },
  component: RootComponent,
});

function RootComponent() {
  const { convexClient } = useRouteContext({ from: Route.id });
  return (
    <RootDocument>
      <ClerkProvider>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <SignedIn>
            <Outlet />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="h-svh flex flex-col min-h-0">
          <div className="flex-grow min-h-0 h-full relative flex flex-col">
            {children}
            <Toaster />
          </div>
        </div>
        <ReactQueryDevtools />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
