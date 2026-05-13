import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const invalidateActivityData = (queryClient: QueryClient, activityId?: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.participation.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });

  if (activityId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.details(activityId) });
  }
};

export const invalidateNotifications = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
};
