import { useQuery } from '@tanstack/react-query';
import { usersRepository } from '@/repositories/users.repository';
import { queryKeys } from './queryKeys';

export const useUserProfile = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => usersRepository.profile(userId!),
    enabled: Boolean(userId),
  });
