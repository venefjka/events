import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityParticipation, ParticipationStatus } from '@/types';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useUserActivityFeed } from '@/contexts/UserActivityFeedContext';
import { normalizeParticipationList } from '@/utils/participation';

export const [ActivityParticipationProvider, useActivityParticipation] = createContextHook(() => {
  const { currentUser, updateUserAttendanceHistory } = useAuth();
  const { activityRecords, allActivities } = useActivities();
  const notificationsContext = typeof useNotifications === 'function' ? useNotifications() : null;
  const queryClient = useQueryClient();
  const { appendEvent } = useUserActivityFeed();

  const participationQuery = useQuery<ActivityParticipation[]>({
    queryKey: ['activityParticipation'],
    queryFn: async () => {
      // TODO(backend): GET /activity-participation?userId=...&activityIds=...
      const stored = await AsyncStorage.getItem('activityParticipation');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return normalizeParticipationList(parsed);
    },
  });

  const saveParticipationMutation = useMutation({
    mutationFn: async (records: ActivityParticipation[]) => {
      await AsyncStorage.setItem('activityParticipation', JSON.stringify(records));
      return records;
    },
    onSuccess: (records) => {
      queryClient.setQueryData(['activityParticipation'], records);
    },
  });

  const participationRecords: ActivityParticipation[] = participationQuery.data || [];

  const getAttendanceHistory = (userId: string) => {
    const attended = participationRecords.filter(
      (record) => record.userId === userId && record.status === 'attended'
    ).length;

    const missed = participationRecords.filter(
      (record) => record.userId === userId && record.status === 'missed'
    ).length;

    return { attended, missed };
  };

  const getUserParticipationRecords = (userId: string) =>
    participationRecords.filter((record) => record.userId === userId);

  const getUserActivityIdsByStatus = (userId: string, statuses: ParticipationStatus[]) => {
    const statusSet = new Set(statuses);
    return participationRecords
      .filter((record) => record.userId === userId && statusSet.has(record.status))
      .map((record) => record.activityId);
  };

  const getParticipationStatus = (activityId: string, userId: string) =>
    participationRecords.find(
      (record) => record.activityId === activityId && record.userId === userId
    )?.status ?? null;

  const applyAttendanceDelta = (
    userId: string,
    previousStatus: ParticipationStatus | null,
    nextStatus: ParticipationStatus | null
  ) => {
    if (!updateUserAttendanceHistory) return;
    let attendedDelta = 0;
    let missedDelta = 0;

    if (previousStatus === 'attended' && nextStatus !== 'attended') {
      attendedDelta -= 1;
    }
    if (previousStatus !== 'attended' && nextStatus === 'attended') {
      attendedDelta += 1;
    }
    if (previousStatus === 'missed' && nextStatus !== 'missed') {
      missedDelta -= 1;
    }
    if (previousStatus !== 'missed' && nextStatus === 'missed') {
      missedDelta += 1;
    }

    if (attendedDelta !== 0 || missedDelta !== 0) {
      updateUserAttendanceHistory(userId, { attendedDelta, missedDelta });
    }
  };

  const upsertParticipation = async (
    activityId: string,
    userId: string,
    status: ActivityParticipation['status']
  ) => {
    const now = new Date().toISOString();
    const existingIndex = participationRecords.findIndex(
      (record) => record.activityId === activityId && record.userId === userId
    );
    const previousStatus =
      existingIndex >= 0 ? participationRecords[existingIndex].status : null;

    if (previousStatus === status) {
      return false;
    }

    const updated =
      existingIndex >= 0
        ? participationRecords.map((record, index) =>
          index === existingIndex
            ? {
              ...record,
              status,
            }
            : record
        )
        : [
          ...participationRecords,
          {
            activityId,
            userId,
            status,
            createdAt: now,
          },
        ];

    await saveParticipationMutation.mutateAsync(updated);
    applyAttendanceDelta(userId, previousStatus, status);
    return true;
  };

  const removeParticipation = async (activityId: string, userId: string) => {
    const existing = participationRecords.find(
      (record) => record.activityId === activityId && record.userId === userId
    );
    if (!existing) return false;
    const updated = participationRecords.filter(
      (record) => !(record.activityId === activityId && record.userId === userId)
    );
    await saveParticipationMutation.mutateAsync(updated);
    applyAttendanceDelta(userId, existing?.status ?? null, null);
    return true;
  };

  const reconcileParticipationStatuses = async () => {
    const now = new Date();
    let changed = false;
    const feedEventsToAppend: Array<{ userId: string; activityId: string; type: 'missed' }> = [];
    const updated = participationRecords.map((record) => {
      const activity = activityRecords.find((a) => a.id === record.activityId);
      if (!activity) return record;
      if (activity.status === 'cancelled') return record;
      const endTime = new Date(activity.endAt ?? activity.startAt);
      if (Number.isNaN(endTime.getTime()) || endTime > now) return record;

      if (record.status === 'accepted') {
        changed = true;
        applyAttendanceDelta(record.userId, record.status, 'missed');
        feedEventsToAppend.push({
          userId: record.userId,
          activityId: record.activityId,
          type: 'missed',
        });
        return { ...record, status: 'missed' as ParticipationStatus };
      }
      if (record.status === 'pending') {
        changed = true;
        return { ...record, status: 'rejected' as ParticipationStatus };
      }
      return record;
    });

    if (changed) {
      await saveParticipationMutation.mutateAsync(updated);
      await Promise.all(feedEventsToAppend.map((event) => appendEvent(event)));
    }
  };

  useEffect(() => {
    if (participationRecords.length > 0 && activityRecords.length > 0) {
      void reconcileParticipationStatuses();
    }
  }, [participationRecords, activityRecords]);

  const requestJoinActivity = (activityId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }

    const existing = participationRecords.find(
      (record) => record.activityId === activityId && record.userId === currentUser.id
    );
    const isAlreadyParticipant =
      existing?.status === 'accepted' || existing?.status === 'attended';
    const isAlreadyPending = existing?.status === 'pending';

    if (isAlreadyParticipant || isAlreadyPending) {
      console.log('Already joined or request pending');
      return;
    }

    if (activity.requiresApproval) {
      if (notificationsContext) {
        notificationsContext.addNotification({
          type: 'request',
          title: 'Новая заявка',
          message: `${currentUser.name} хочет присоединиться к вашей активности`,
          activityId: activity.id,
          userId: activity.organizerId,
          actionRequired: true,
          requestUserId: currentUser.id,
          activityTitle: activity.title,
        });
      }
      void upsertParticipation(activity.id, currentUser.id, 'pending');
    } else {
      void joinActivity(activityId);
    }
  };

  const joinActivity = async (activityId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }

    const isAlreadyParticipant = participationRecords.some(
      (record) =>
        record.activityId === activityId &&
        record.userId === currentUser.id &&
        (record.status === 'accepted' || record.status === 'attended')
    );
    if (isAlreadyParticipant) {
      console.log('Already a participant');
      return;
    }

    const changed = await upsertParticipation(activityId, currentUser.id, 'accepted');
    if (changed) {
      await appendEvent({
        userId: currentUser.id,
        activityId,
        type: 'joined',
      });
    }
  };

  const approveJoinRequest = async (activityId: string, userId: string) => {
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }
    const changed = await upsertParticipation(activityId, userId, 'accepted');
    if (changed) {
      await appendEvent({
        userId,
        activityId,
        type: 'joined',
      });
    }

    if (notificationsContext) {
      notificationsContext.addNotification({
        type: 'request_approved',
        title: 'Заявка одобрена',
        message: `Ваша заявка на участие в "${activity.title}" была одобрена!`,
        activityId: activity.id,
        userId,
        activityTitle: activity.title,
      });
    }
  };

  const rejectJoinRequest = async (activityId: string, userId: string) => {
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    await upsertParticipation(activityId, userId, 'rejected');

    if (notificationsContext) {
      notificationsContext.addNotification({
        type: 'request_rejected',
        title: 'Заявка отклонена',
        message: `Ваша заявка на участие в "${activity.title}" была отклонена`,
        activityId: activity.id,
        userId,
        activityTitle: activity.title,
      });
    }
  };

  const leaveActivity = async (activityId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;

    const eventTime = new Date(activity.startAt);
    const now = new Date();
    const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent > 2) {
      const removed = await removeParticipation(activityId, currentUser.id);
      if (removed) {
        await appendEvent({
          userId: currentUser.id,
          activityId,
          type: 'leaved',
        });
      }
      return;
    }

    const changed = await upsertParticipation(activityId, currentUser.id, 'missed');
    if (changed) {
      await appendEvent({
        userId: currentUser.id,
        activityId,
        type: 'missed',
      });
    }
  };

  const cancelJoinRequest = async (activityId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    const removed = await removeParticipation(activityId, currentUser.id);
    if (removed) {
      await appendEvent({
        userId: currentUser.id,
        activityId,
        type: 'leaved',
      });
    }
  };

  const markAttendance = async (activityId: string, userId: string) => {
    if (!currentUser) return;
    const activity = allActivities.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }

    const isRegistered =
      participationRecords.some(
        (record) =>
          record.activityId === activityId &&
          record.userId === userId &&
          (record.status === 'accepted' || record.status === 'attended')
      ) ||
      activity.attendedUsers.includes(userId) ||
      (userId !== activity.organizerId &&
        activity.currentParticipants.some((participant) => participant.id === userId));
    if (!isRegistered) {
      console.log('User not registered for this activity');
      return;
    }

    const changed = await upsertParticipation(activityId, userId, 'attended');
    if (changed) {
      await appendEvent({
        userId,
        activityId,
        type: 'attended',
      });
    }

    if (notificationsContext) {
      notificationsContext.addNotification({
        type: 'rate_request',
        title: 'Оцените мероприятие',
        message: `Как прошло мероприятие "${activity.title}"? Оставьте отзыв!`,
        activityId: activity.id,
        userId,
        activityTitle: activity.title,
      });
    }
  };

  return {
    getUserParticipationRecords,
    getUserActivityIdsByStatus,
    getParticipationStatus,
    getAttendanceHistory,
    participationUpdatedAt: participationQuery.dataUpdatedAt,
    requestJoinActivity,
    joinActivity,
    leaveActivity,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    markAttendance,
  };
});
