import { ActivityParticipation, ParticipationStatus } from '@/types';

export const isParticipationStatus = (value: unknown): value is ParticipationStatus =>
  value === 'pending' ||
  value === 'accepted' ||
  value === 'attended' ||
  value === 'rejected' ||
  value === 'missed';

export const normalizeParticipationRecord = (record: unknown): ActivityParticipation | null => {
  if (!record || typeof record !== 'object') return null;
  const entry = record as {
    activityId?: unknown;
    userId?: unknown;
    status?: unknown;
    createdAt?: unknown;
  };

  if (typeof entry.activityId !== 'string' || typeof entry.userId !== 'string') return null;
  if (typeof entry.createdAt !== 'string') return null;
  if (!isParticipationStatus(entry.status)) return null;

  return {
    activityId: entry.activityId,
    userId: entry.userId,
    status: entry.status,
    createdAt: entry.createdAt,
  };
};

export const normalizeParticipationList = (payload: unknown): ActivityParticipation[] => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((record) => normalizeParticipationRecord(record))
    .filter((record): record is ActivityParticipation => Boolean(record));
};
