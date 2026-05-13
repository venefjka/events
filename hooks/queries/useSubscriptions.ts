import { useQuery } from '@tanstack/react-query';
import { subscriptionsRepository } from '@/repositories/subscriptions.repository';
import type { SubscriptionsQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useSubscriptions = (query?: SubscriptionsQuery) =>
  useQuery({
    queryKey: queryKeys.subscriptions.list(query),
    queryFn: () => subscriptionsRepository.list(query),
  });
