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
import { seo } from '@/utils/seo';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import appCss from '@/styles/app.css?url';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { LoginAnonymously } from '@/components/auth/anonymous';
import { AppProvider } from '@/context/app-context';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
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
      {
        rel: 'stylesheet',
        href: appCss,
      },
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
  component: RootComponent,
});

function RootComponent() {
  const { convexQueryClient } = useRouteContext({
    from: Route.id,
  });
  return (
    <ConvexAuthProvider client={convexQueryClient.convexClient}>
      <RootDocument>
        <AuthLoading>
          <div className="h-dvh w-full bg-background" />
        </AuthLoading>
        <Authenticated>
          <AppProvider>
            <Outlet />
          </AppProvider>
        </Authenticated>
        <Unauthenticated>
          <LoginAnonymously />
        </Unauthenticated>
      </RootDocument>
    </ConvexAuthProvider>
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
            <Toaster richColors />
          </div>
        </div>
        <ReactQueryDevtools buttonPosition="top-left" />
        <TanStackRouterDevtools position="top-left" />
        <Scripts />
      </body>
    </html>
  );
}
