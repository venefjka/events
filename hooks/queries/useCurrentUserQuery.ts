import { useQuery } from '@tanstack/react-query';
import { authRepository } from '@/repositories/authRepository';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const authQueryKeys = queryKeys.auth;

export const useCurrentUserQuery = () =>
  useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authRepository.getCurrentUser,
  });
