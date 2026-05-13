import { ApiError } from "@/api/client";

const QR_PAYLOAD_VERSION = 1;
const QR_PAYLOAD_KIND = 'attendance-token';

export type QrPayload = {
  version: number;
  kind: string;
  token: string;
  userId: string;
  activityId: string;
};

export const createQrPayload = (token: string, userId: string, activityId: string): string =>
  JSON.stringify({
    version: QR_PAYLOAD_VERSION,
    kind: QR_PAYLOAD_KIND,
    token,
    userId,
    activityId,
  } satisfies QrPayload);

export const extractQrPayload = (value: string | null | undefined): Partial<QrPayload> | null => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized || !normalized.startsWith('{')) return null;

  try {
    return JSON.parse(normalized) as Partial<QrPayload>;
  } catch {
    return null;
  }
};

export const extractQrToken = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  const payload = extractQrPayload(normalized);
  if (payload) {
    if (typeof payload.token === 'string' && payload.token.trim()) {
      return payload.token.trim();
    }
    return normalized;
  }

  return normalized;
};

export const getQrScanErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    const details = error.details as {
      error?: {
        code?: unknown;
        message?: unknown;
      };
    };
    const code = details?.error?.code;
    const backendMessage = details?.error?.message;

    switch (code) {
      case 'IS_ORGANIZER':
        return 'Это организатор активности, его отмечать не нужно.';
      case 'NOT_PARTICIPANT':
        return 'Этот пользователь не записан на активность.';
      case 'ALREADY_ATTENDED':
        return 'Этот пользователь уже отмечен как посетивший.';
      case 'INVALID_PARTICIPATION_STATE':
        return typeof backendMessage === 'string'
          ? backendMessage
          : 'Участника нельзя отметить в текущем статусе.';
      case 'TOKEN_USED':
        return 'Этот QR-код уже был использован.';
      case 'TOKEN_EXPIRED':
        return 'QR-код истек. Попросите участника обновить код.';
      case 'INVALID_TOKEN':
        return 'QR-код не найден или больше недействителен.';
      case 'BAD_REQUEST':
        return 'Не удалось прочитать QR-токен.';
    }

    if (typeof backendMessage === 'string') {
      return backendMessage;
    }
  }

  return error instanceof Error ? error.message : 'Не удалось отметить посещение.';
};
