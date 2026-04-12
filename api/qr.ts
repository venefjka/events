import type {
  IssueQrTokenResponseDto,
  ResolveQrTokenResponseDto,
} from '@/types/dto';
import type { RequestConfig, ResolveQrTokenRequestDto, ScanAttendanceRequest } from './types';
import { apiRequest } from './client';

export const qrApi = {
  issueMyToken: (config?: RequestConfig) =>
    apiRequest<IssueQrTokenResponseDto>('/me/qr-token', { method: 'POST', signal: config?.signal }, config?.authToken),

  resolveToken: (payload: ResolveQrTokenRequestDto, config?: RequestConfig) =>
    apiRequest<ResolveQrTokenResponseDto>(
      '/qr-tokens/resolve',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),

  scanAttendance: (activityId: string, payload: ScanAttendanceRequest, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${activityId}/attendance/scan`,
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),
};
