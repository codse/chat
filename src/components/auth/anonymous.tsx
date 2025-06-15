import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function LoginAnonymously() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      signIn('anonymous')
        .catch((error) => {
          console.error('error', error);
        })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: [api.auth.getCurrentUser, {}],
          });
        });
    }
  }, [signIn, isAuthenticated, isLoading]);

  return null;
}
