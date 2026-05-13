import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { authRepository } from '@/repositories/authRepository';
import type { UserProfileDto } from '@/types/dto';
import type { LoginRequest, RegisterRequest, UpdateMeRequest } from '@/types/requests';
import { authQueryKeys } from '@/hooks/queries/useCurrentUserQuery';
import { queryKeys } from '@/hooks/queries/queryKeys';

const setCurrentUser = (queryClient: QueryClient, user: UserProfileDto | null) => {
  queryClient.setQueryData(authQueryKeys.currentUser, user);
};

const userScopedQueryKeys = [
  queryKeys.activities.all,
  queryKeys.participation.all,
  queryKeys.ratings.all,
  queryKeys.notifications.all,
  queryKeys.subscriptions.all,
  queryKeys.users.all,
  queryKeys.qr.all,
] as const;

const resetUserScopedQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: authQueryKeys.all }),
    ...userScopedQueryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
  ]);

  userScopedQueryKeys.forEach((queryKey) => {
    queryClient.removeQueries({ queryKey });
  });
};

const switchCurrentUser = async (queryClient: QueryClient, user: UserProfileDto | null) => {
  await resetUserScopedQueries(queryClient);
  setCurrentUser(queryClient, user);
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authRepository.login(payload),
    onSuccess: async (session) => {
      await switchCurrentUser(queryClient, session.user);
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authRepository.register(payload),
    onSuccess: async (session) => {
      await switchCurrentUser(queryClient, session.user);
    },
  });
};

export const useRememberedLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authRepository.loginRemembered(userId),
    onSuccess: async (session) => {
      await switchCurrentUser(queryClient, session.user);
    },
  });
};

export const useRemoveRememberedUserMutation = () =>
  useMutation({
    mutationFn: (userId: string) => authRepository.removeRememberedUser(userId),
  });

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMeRequest) => authRepository.updateMe(payload),
    onSuccess: (user) => {
      setCurrentUser(queryClient, user);
      queryClient.setQueryData(queryKeys.users.profile(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

export const useDeleteMeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.deleteMe,
    onSuccess: async () => {
      await resetUserScopedQueries(queryClient);
      setCurrentUser(queryClient, null);
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.logout,
    onMutate: () => {
      setCurrentUser(queryClient, null);
      void resetUserScopedQueries(queryClient);
    },
    onSettled: () => {
      setCurrentUser(queryClient, null);
    },
  });
};
