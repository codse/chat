import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthActions } from '@convex-dev/auth/react';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { LinkingSession } from '@/utils/linking-session';
import { PublicUser } from '@/types/chat';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ArrowLeft, InfoIcon } from 'lucide-react';
import { Link, Navigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [linkChats, setLinkChats] = useState(false);

  const { data: user, isFetching } = useQuery(
    convexQuery(api.auth.getCurrentUser, {
      includeCount: true,
    })
  );

  const { mutate: loginWithLinkingSession } = useMutation({
    mutationFn: useConvexMutation(api.linking.mutations.createLinkingSession),
    onSuccess: (sessionId: string) => {
      LinkingSession.track(sessionId);
      signIn('google', {
        redirectTo: `/session/${sessionId}`,
      });
    },
    onError: () => {
      toast.error('Failed to create linking session');
      setIsSigningIn(false);
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const chatCount = (user as PublicUser)?.chat?.count;
      if (chatCount && linkChats) {
        // If the user has chats, we need to create a linking session to link the chats to the new account.
        loginWithLinkingSession({});
      } else {
        // If the user doesn't have chats, we can just sign in and redirect to the home page.
        await signIn('google', {
          redirectTo: '/',
        });
      }
    } catch (error) {
      setIsSigningIn(false);
      toast.error('Failed to sign in with Google');
    }
  };

  const chatCount = (user as PublicUser)?.chat?.count;

  if (!user?.isAnonymous && !isFetching) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className={cn('w-[350px]', isFetching && 'animate-pulse')}>
        <CardHeader>
          <Link
            to="/"
            className="flex mb-3 text-sm items-center gap-2 hover:underline text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back to chat</span>
          </Link>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>
            Sign in to unlock more features and keep your chats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            variant="outline"
            disabled={isSigningIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          {Boolean(chatCount) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-row gap-2 items-center mt-6 w-fit">
                  <Checkbox
                    id="link-chats"
                    checked={linkChats}
                    onCheckedChange={(checked) => setLinkChats(!!checked)}
                  />
                  <Label htmlFor="link-chats">
                    Link my chats{' '}
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                You have {chatCount} unsaved{' '}
                {chatCount === 1 ? 'chat' : 'chats'} from this session.
                <br />
                {chatCount === 1 ? 'This chat' : 'These chats'} will be{' '}
                {linkChats
                  ? 'linked to your account.'
                  : 'deleted if not linked.'}
              </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
