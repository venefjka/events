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
