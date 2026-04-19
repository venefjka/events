import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserActivityFeedEvent } from '@/types';
import {
  appendUserActivityFeedEvent,
  loadUserActivityFeed,
} from '@/utils/userActivityFeed';

const USER_ACTIVITY_FEED_QUERY_KEY = ['userActivityFeed'] as const;

export const [UserActivityFeedProvider, useUserActivityFeed] = createContextHook(() => {
  const queryClient = useQueryClient();

  const feedQuery = useQuery<UserActivityFeedEvent[]>({
    queryKey: USER_ACTIVITY_FEED_QUERY_KEY,
    queryFn: async () => {
      // TODO(backend): GET /users/:id/activity-feed or GET /me/activity-feed
      // Keep screens and domain contexts unaware of the transport layer.
      return loadUserActivityFeed();
    },
  });

  const appendEventMutation = useMutation({
    mutationFn: async (
      input: Omit<UserActivityFeedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
    ) => {
      // TODO(backend): prefer backend-generated events from domain actions.
      // POST /activity-feed/events is only a transition path if backend rollout is incremental.
      return appendUserActivityFeedEvent(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_ACTIVITY_FEED_QUERY_KEY });
    },
  });

  const appendEvent = async (
    input: Omit<UserActivityFeedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ) => appendEventMutation.mutateAsync(input);

  const refreshFeed = () =>
    queryClient.invalidateQueries({ queryKey: USER_ACTIVITY_FEED_QUERY_KEY });

  return {
    feedEvents: feedQuery.data ?? [],
    isLoading: feedQuery.isLoading,
    feedUpdatedAt: feedQuery.dataUpdatedAt,
    appendEvent,
    refreshFeed,
  };
});
