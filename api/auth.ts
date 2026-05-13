import type { AuthSessionDto, AuthTokensDto, UserProfileDto } from '@/types/dto';
import type { LoginRequest, RegisterRequest, RequestConfig, UpdateMeRequest } from './types';
import { apiRequest } from './client';

export const authApi = {
  getMe: (config?: RequestConfig) =>
    apiRequest<UserProfileDto>('/me', { method: 'GET', signal: config?.signal }, config?.authToken),

  login: (payload: LoginRequest, config?: RequestConfig) =>
    apiRequest<AuthSessionDto>('/auth/login', { method: 'POST', body: payload, signal: config?.signal }),

  register: (payload: RegisterRequest, config?: RequestConfig) =>
    apiRequest<AuthSessionDto>('/auth/register', { method: 'POST', body: payload, signal: config?.signal }),

  logout: (refreshToken?: string | null, config?: RequestConfig) =>
    apiRequest<void>(
      '/auth/logout',
      { method: 'POST', body: refreshToken ? { refreshToken } : undefined, signal: config?.signal },
      config?.authToken
    ),

  refresh: (refreshToken: string, config?: RequestConfig) =>
    apiRequest<AuthTokensDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      signal: config?.signal,
    }),

  updateMe: (payload: UpdateMeRequest, config?: RequestConfig) =>
    apiRequest<UserProfileDto>('/me', { method: 'PATCH', body: payload, signal: config?.signal }, config?.authToken),

  deleteMe: (config?: RequestConfig) =>
    apiRequest<void>('/me', { method: 'DELETE', signal: config?.signal }, config?.authToken),
};
