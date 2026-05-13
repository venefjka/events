import createContextHook from '@nkzw/create-context-hook';
import { useCurrentUserQuery } from '@/hooks/queries/useCurrentUserQuery';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const currentUserQuery = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation();

  return {
    currentUser: currentUserQuery.data ?? null,
    isAuthReady: !currentUserQuery.isLoading,
    isAuthenticated: Boolean(currentUserQuery.data),
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
});
