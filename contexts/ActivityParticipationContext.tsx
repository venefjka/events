import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityParticipation, ParticipationStatus } from '@/types';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { normalizeParticipationList } from '@/utils/participation';

export const [ActivityParticipationProvider, useActivityParticipation] = createContextHook(() => {
  const { currentUser, updateUserAttendanceHistory } = useAuth();
  const { activityRecords } = useActivities();
  const notificationsContext = typeof useNotifications === 'function' ? useNotifications() : null;
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityParticipation'] });
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

  const upsertParticipation = (
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
      return;
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

    saveParticipationMutation.mutate(updated);
    applyAttendanceDelta(userId, previousStatus, status);
  };

  const removeParticipation = (activityId: string, userId: string) => {
    const existing = participationRecords.find(
      (record) => record.activityId === activityId && record.userId === userId
    );
    const updated = participationRecords.filter(
      (record) => !(record.activityId === activityId && record.userId === userId)
    );
    saveParticipationMutation.mutate(updated);
    applyAttendanceDelta(userId, existing?.status ?? null, null);
  };

  const reconcileParticipationStatuses = () => {
    const now = new Date();
    let changed = false;
    const updated = participationRecords.map((record) => {
    const activity = activityRecords.find((a) => a.id === record.activityId);
    if (!activity) return record;
    if (activity.status === 'cancelled') return record;
      const endTime = new Date(activity.endAt ?? activity.startAt);
      if (Number.isNaN(endTime.getTime()) || endTime > now) return record;

      if (record.status === 'accepted') {
        changed = true;
        applyAttendanceDelta(record.userId, record.status, 'missed');
        return { ...record, status: 'missed' as ParticipationStatus };
      }
      if (record.status === 'pending') {
        changed = true;
        return { ...record, status: 'rejected' as ParticipationStatus };
      }
      return record;
    });

    if (changed) {
      saveParticipationMutation.mutate(updated);
    }
  };

  useEffect(() => {
    if (participationRecords.length > 0 && activityRecords.length > 0) {
      reconcileParticipationStatuses();
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
      upsertParticipation(activity.id, currentUser.id, 'pending');
    } else {
      joinActivity(activityId);
    }
  };

  const joinActivity = (activityId: string) => {
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

    upsertParticipation(activityId, currentUser.id, 'accepted');
  };

  const approveJoinRequest = (activityId: string, userId: string) => {
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }
    upsertParticipation(activityId, userId, 'accepted');

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

  const rejectJoinRequest = (activityId: string, userId: string) => {
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    upsertParticipation(activityId, userId, 'rejected');

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
      removeParticipation(activityId, currentUser.id);
      return;
    }

    upsertParticipation(activityId, currentUser.id, 'missed');
  };

  const cancelJoinRequest = (activityId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    removeParticipation(activityId, currentUser.id);
  };

  const markAttendance = async (activityId: string, userId: string) => {
    if (!currentUser) return;
    const activity = activityRecords.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.status === 'cancelled') {
      console.log('Activity cancelled');
      return;
    }

    const isRegistered = participationRecords.some(
      (record) =>
        record.activityId === activityId &&
        record.userId === userId &&
        (record.status === 'accepted' || record.status === 'attended')
    );
    if (!isRegistered) {
      console.log('User not registered for this activity');
      return;
    }

    upsertParticipation(activityId, userId, 'attended');

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
