import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityRating, Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useUserActivityFeed } from '@/contexts/UserActivityFeedContext';
import { useUsers } from '@/contexts/UsersContext';

export const [ActivityRatingsProvider, useActivityRatings] = createContextHook(() => {
  const { currentUser, updateUser } = useAuth();
  const { allActivities } = useActivities();
  const queryClient = useQueryClient();
  const { appendEvent } = useUserActivityFeed();
  const { getUserById } = useUsers();

  const ratingsQuery = useQuery({
    queryKey: ['activityRatings'],
    queryFn: async () => {
      // TODO(backend): GET /activity-ratings?activityIds=...
      const stored = await AsyncStorage.getItem('activityRatings');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveRatingsMutation = useMutation({
    mutationFn: async (records: ActivityRating[]) => {
      await AsyncStorage.setItem('activityRatings', JSON.stringify(records));
      return records;
    },
    onSuccess: () => {
      ratingsQuery.refetch();
    },
  });

  const activityRatings: ActivityRating[] = ratingsQuery.data || [];

  const getRatingsForActivity = (activityId: string) =>
    activityRatings.filter((rating) => rating.activityId === activityId);

  const hasUserRated = (activityId: string, userId: string) =>
    activityRatings.some((rating) => rating.activityId === activityId && rating.userId === userId);

  const rateActivity = async (activityId: string, rating: number, comment?: string) => {
    if (!currentUser) return;
    const activity = allActivities.find((a) => a.id === activityId);
    if (!activity) return;

    if (!activity.attendedUsers.includes(currentUser.id)) {
      console.log('Can only rate activities you attended');
      return;
    }

    const activityRating: ActivityRating = {
      id: `rating-${Date.now()}`,
      userId: currentUser.id,
      activityId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    const updatedRatings = [...activityRatings, activityRating];
    await saveRatingsMutation.mutateAsync(updatedRatings);
    await appendEvent({
      userId: currentUser.id,
      activityId,
      type: 'rated',
      timestamp: activityRating.timestamp,
    });

    const organizerId = activity.organizerId;
    const organizerActivities = allActivities.filter((a) => a.organizerId === organizerId);
    const organizerRatings = updatedRatings.filter((r) =>
      organizerActivities.some((a) => a.id === r.activityId)
    );

    let newRating = 4.5;
    if (organizerRatings.length > 0) {
      const totalRating = organizerRatings.reduce((sum, r) => sum + r.rating, 0);
      newRating = totalRating / organizerRatings.length;
    }

    if (updateUser) {
      await updateUser(organizerId, { rating: newRating });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['auth'] }),
      queryClient.invalidateQueries({ queryKey: ['activities'] }),
    ]);
  };

  const getUserRating = (userId: string) => {
    const userActivities = allActivities.filter((a) => a.organizerId === userId);
    const userRatings = activityRatings.filter((r) =>
      userActivities.some((a) => a.id === r.activityId)
    );

    if (userRatings.length === 0) return 4.5;

    const totalRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
    return totalRating / userRatings.length;
  };

  const getReviewsForOrganizer = (organizerId: string): Review[] => {
    const organizerActivityIds = new Set(
      allActivities
        .filter((activity) => activity.organizerId === organizerId)
        .map((activity) => activity.id)
    );

    return activityRatings
      .filter((rating) => organizerActivityIds.has(rating.activityId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((rating) => {
        const author = getUserById(rating.userId);

        return {
          id: rating.id,
          fromUserId: rating.userId,
          fromUserName: author?.name ?? 'Пользователь',
          rating: rating.rating,
          text: rating.comment ?? '',
          date: rating.timestamp,
          activityId: rating.activityId,
        };
      });
  };

  return {
    activityRatings,
    getRatingsForActivity,
    getReviewsForOrganizer,
    hasUserRated,
    rateActivity,
    getUserRating,
  };
});
