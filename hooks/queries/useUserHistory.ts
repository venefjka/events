import { useQuery } from '@tanstack/react-query';
import { usersRepository } from '@/repositories/users.repository';
import type { UserHistoryQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useUserHistory = (userId: string | undefined, query: UserHistoryQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.users.history(userId, query),
    queryFn: () => usersRepository.history(userId!, query),
    enabled: Boolean(userId) && enabled,
  });
