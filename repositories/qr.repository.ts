import { qrApi } from '@/api/qr';
import { authRepository } from '@/repositories/authRepository';
import type { ScanAttendanceRequest } from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const qrRepository = {
  issueMyToken: async () => qrApi.issueMyToken(await authConfig()),
  scanAttendance: async (activityId: string, payload: ScanAttendanceRequest) =>
    qrApi.scanAttendance(activityId, payload, await authConfig()),
};
