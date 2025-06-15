import { LinkingSession } from '@/utils/linking-session';
import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { api } from '@convex/_generated/api';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/session/$sessionId')({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const localSessionId = LinkingSession.get();

  const { mutate: linkAccount, isError } = useMutation({
    mutationFn: useConvexMutation(api.linking.mutations.linkAccount),
    onSuccess: () => {
      navigate({ to: '/', replace: true });
    },
    onError: () => {
      toast.error('Failed to link chats');
    },
  });

  const shouldLink = localSessionId && sessionId === localSessionId;

  useEffect(() => {
    if (!shouldLink) {
      LinkingSession.clear();
    } else {
      linkAccount({ sessionId });
    }
  }, [shouldLink, sessionId]);

  if (!shouldLink) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
        <Loader className="w-4 h-4 animate-spin" />
        <p className="text-muted-foreground">
          Linking your previous chats to your current account.
        </p>
        {isError && (
          <>
            <p className="text-destructive">
              Failed to link chats. Please try again.
            </p>
            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  LinkingSession.clear();
                  navigate({ to: '/' });
                }}
              >
                Skip
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  linkAccount({ sessionId });
                }}
              >
                Try again
              </Button>
            </div>
          </>
        )}
        {!isError && (
          <>
            <Skeleton className="h-4 w-full max-w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full max-w-3/5" />
          </>
        )}
      </div>
    </div>
  );
}
