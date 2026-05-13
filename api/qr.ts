import type {
  IssueQrTokenResponseDto,
  ScanAttendanceResponseDto,
} from '@/types/dto';
import type { RequestConfig, ScanAttendanceRequest } from './types';
import { apiRequest } from './client';

export const qrApi = {
  issueMyToken: (config?: RequestConfig) =>
    apiRequest<IssueQrTokenResponseDto>('/me/qr-token', { method: 'POST', signal: config?.signal }, config?.authToken),

  scanAttendance: (activityId: string, payload: ScanAttendanceRequest, config?: RequestConfig) =>
    apiRequest<ScanAttendanceResponseDto>(
      `/activities/${activityId}/attendance/scan`,
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),
};
