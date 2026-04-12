import type { ApiRequestOptions } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions,
  authToken?: string
): Promise<T> {
  const API_BASE_URL = 'http://_._._._:_';
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Token ${authToken}`;
  }

  const config: RequestInit = {
    method: options.method,
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined && options.body !== null) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }

      throw new ApiError(
        response.status,
        getErrorMessage(errorData) ?? 'Request failed',
        errorData
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(0, 'Ошибка сети', {
      non_field_errors: 'Network error.',
    });
  }
}

const getErrorMessage = (errorData: unknown) => {
  if (!errorData || typeof errorData !== 'object') {
    return null;
  }

  const maybeDetail = (errorData as { detail?: unknown }).detail;
  return typeof maybeDetail === 'string' ? maybeDetail : null;
};
