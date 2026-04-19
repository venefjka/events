import createContextHook from '@nkzw/create-context-hook';
import { useMemo } from 'react';
import {
  Activity,
  ActivityParticipation,
  ActivityRecord,
  ActivityView,
  UserPublic,
  UserRecord,
} from '../types';
import { mockActivityRecords, mockUsers } from '../mocks/activities';
import { categories } from '../constants/categories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useUserActivityFeed } from './UserActivityFeedContext';
import { useUsers } from './UsersContext';
import {
  ActivityDraft,
  buildActivity,
  normalizeActivityRecord,
  toUserPublicFallback,
} from '../utils/activityUtils';
import { normalizeParticipationList } from '@/utils/participation';

export const [ActivitiesProvider, useActivities] = createContextHook(() => {
  const { currentUser } = useAuth();
  const { appendEvent } = useUserActivityFeed();
  const { usersMap, getUserPublic } = useUsers();

  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      // TODO(backend): GET /activities?fields=...&limit=...&offset=...
      // Keep this payload minimal (no participants/ratings) for list screens.
      const stored = await AsyncStorage.getItem('activities');
      const raw = stored ? JSON.parse(stored) : mockActivityRecords;
      return {
        records: Array.isArray(raw) ? raw.map(normalizeActivityRecord) : mockActivityRecords,
        isMock: !stored,
      };
    },
  });

  const participationQuery = useQuery<ActivityParticipation[]>({
    queryKey: ['activityParticipation'],
    queryFn: async () => {
      // TODO(backend): GET /activity-participation?activityIds=...
      const stored = await AsyncStorage.getItem('activityParticipation');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return normalizeParticipationList(parsed);
    },
  });

  const saveActivitiesMutation = useMutation({
    mutationFn: async (records: ActivityRecord[]) => {
      await AsyncStorage.setItem('activities', JSON.stringify(records));
      return records;
    },
    onSuccess: () => {
      activitiesQuery.refetch();
    },
  });
  const activityRecords: ActivityRecord[] = activitiesQuery.data?.records || [];
  const isUsingMockActivities = activitiesQuery.data?.isMock ?? false;
  const participationRecords = participationQuery.data || [];

  const participationSnapshot = useMemo(() => {
    const map = new Map<
      string,
      { participantIds: Set<string>; pendingIds: Set<string>; attendedIds: Set<string> }
    >();

    for (const record of participationRecords) {
      if (!map.has(record.activityId)) {
        map.set(record.activityId, {
          participantIds: new Set<string>(),
          pendingIds: new Set<string>(),
          attendedIds: new Set<string>(),
        });
      }
      const entry = map.get(record.activityId)!;
      if (record.status === 'pending') {
        entry.pendingIds.add(record.userId);
      }
      if (record.status === 'accepted' || record.status === 'attended') {
        entry.participantIds.add(record.userId);
      }
      if (record.status === 'attended') {
        entry.attendedIds.add(record.userId);
      }
    }

    return map;
  }, [participationRecords]);

  const activityViews: ActivityView[] = useMemo(() => {
    const resolvedUsersMap = isUsingMockActivities
      ? new Map<string, UserRecord>([
          ...mockUsers.map((user) => [user.id, user] as const),
          ...usersMap,
        ])
      : usersMap;

    const toPublicUser = (userId: string): UserPublic => {
      const user = resolvedUsersMap.get(userId);
      return user
        ? getUserPublic(userId, {
            viewerId: currentUser?.id,
            attendanceHistory: user.attendanceHistory,
          }) ?? toUserPublicFallback(userId)
        : toUserPublicFallback(userId);
    };

    return activityRecords.map((record) => {
      const category = categories.find((cat) => cat.id === record.categoryId) ?? categories[0];
      const subcategory = category?.subcategories.find((sub) => sub.id === record.subcategoryId);
      const organizer = toPublicUser(record.organizerId);
      const snapshot = participationSnapshot.get(record.id);
      const participantIds = new Set(snapshot?.participantIds ?? []);
      participantIds.add(record.organizerId);
      const currentParticipants = Array.from(participantIds).map((id) => toPublicUser(id));
      const pendingRequests = Array.from(snapshot?.pendingIds ?? []).map((id) => toPublicUser(id));
      const attendedUsers = Array.from(snapshot?.attendedIds ?? []);

      return {
        ...record,
        category,
        subcategory,
        organizer,
        currentParticipants,
        pendingRequests,
        attendedUsers,
        ratings: [],
      };
    });
    // NOTE: This is a cheap local join. For backend, fetch fragments:
    // - list screen: activities + category/subcategory id only
    // - detail screen: participants and organizer profiles by ids
    // - ratings: fetched separately by activity id
  }, [
    activityRecords,
    currentUser?.id,
    getUserPublic,
    isUsingMockActivities,
    participationSnapshot,
    usersMap,
  ]);

  const userActivitiesQuery = useQuery({
    queryKey: ['userActivities', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return { joined: [], saved: [] };
      const stored = await AsyncStorage.getItem(`userActivities-${currentUser.id}`);
      return stored ? JSON.parse(stored) : { joined: [], saved: [] };
    },
    enabled: !!currentUser,
  });

  const saveUserActivitiesMutation = useMutation({
    mutationFn: async ({ joined, saved }: { joined: string[]; saved: string[] }) => {
      if (!currentUser) return;
      await AsyncStorage.setItem(
        `userActivities-${currentUser.id}`,
        JSON.stringify({ joined, saved })
      );
    },
    onSuccess: () => {
      userActivitiesQuery.refetch();
    },
  });

  const joinedActivities = userActivitiesQuery.data?.joined || [];
  const savedActivities = userActivitiesQuery.data?.saved || [];

  const createActivities = (newActivities: ActivityDraft[]) => {
    if (!currentUser) return [];
    const created = newActivities.map((payload) => buildActivity(payload, currentUser.id));
    const updatedActivities = [...created, ...activityRecords];
    saveActivitiesMutation.mutate(updatedActivities);
    created.forEach((activity) => {
      void appendEvent({
        userId: currentUser.id,
        activityId: activity.id,
        type: 'created',
        timestamp: activity.createdAt,
      });
    });
    return created;
  };

  const createActivity = (newActivity: ActivityDraft) => {
    if (!currentUser) return null;
    const [created] = createActivities([newActivity]);
    return created ?? null;
  };

  const updateActivity = (activityId: string, patch: Partial<ActivityRecord>) => {
    const updatedRecords = activityRecords.map((record) =>
      record.id === activityId
        ? {
          ...record,
          ...patch,
          updatedAt: new Date().toISOString(),
        }
        : record
    );
    saveActivitiesMutation.mutate(updatedRecords);
  };

  const deleteActivity = (activityId: string) => {
    const updatedRecords = activityRecords.filter((record) => record.id !== activityId);
    saveActivitiesMutation.mutate(updatedRecords);
  };

  const cancelActivity = (activityId: string) => {
    const record = activityRecords.find((activity) => activity.id === activityId);
    if (!record) return;

    updateActivity(activityId, { status: 'cancelled' });
    if (currentUser && currentUser.id === record.organizerId) {
      void appendEvent({
        userId: currentUser.id,
        activityId,
        type: 'cancelled',
      });
    }
  };

  const toggleSaveActivity = (activityId: string) => {
    if (!currentUser) return;
    const updatedSaved = savedActivities.includes(activityId)
      ? savedActivities.filter((id: string) => id !== activityId)
      : [...savedActivities, activityId];
    saveUserActivitiesMutation.mutate({ joined: joinedActivities, saved: updatedSaved });
  };

  return {
    activities: activityViews as Activity[],
    allActivities: activityViews as Activity[],
    activityRecords,
    saveActivities: (records: ActivityRecord[]) => saveActivitiesMutation.mutate(records),
    joinedActivities,
    savedActivities,
    toggleSaveActivity,
    createActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    cancelActivity,
  };
});
