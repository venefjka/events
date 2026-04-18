import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityRating, UserRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';

export const [ActivityRatingsProvider, useActivityRatings] = createContextHook(() => {
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const queryClient = useQueryClient();

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

    const usersJson = await AsyncStorage.getItem('localUsers');
    const usersList: UserRecord[] = usersJson ? JSON.parse(usersJson) : [];
    const updatedUsers = usersList.map((acc) => {
      if (acc.id === organizerId) {
        return {
          ...acc,
          rating: newRating,
        };
      }
      return acc;
    });

    await AsyncStorage.setItem('localUsers', JSON.stringify(updatedUsers));

    if (organizerId === currentUser.id) {
      const updatedCurrentUser = updatedUsers.find((acc) => acc.id === currentUser.id);
      if (updatedCurrentUser) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }
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

  return {
    activityRatings,
    getRatingsForActivity,
    hasUserRated,
    rateActivity,
    getUserRating,
  };
});
