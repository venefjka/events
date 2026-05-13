import type { ApiRequestOptions } from './types';
import { toCamelCaseKeys, toSnakeCaseKeys } from './case';

export const API_BASE_URL = 'http://_._._._:_';

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
  const url = `${API_BASE_URL}${endpoint}`;
  const isMultipart = isFormData(options.body);
  const body = isMultipart ? options.body : toSnakeCaseKeys(options.body);

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method: options.method,
    headers,
    signal: options.signal,
  };

  if (body !== undefined && body !== null) {
    config.body = isMultipart ? (body as BodyInit) : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = toCamelCaseKeys(await response.json());
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

    return toCamelCaseKeys<T>(await response.json());
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(0, 'Network error.', {
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

const isFormData = (value: unknown): value is FormData => {
  return typeof FormData !== 'undefined' && value instanceof FormData;
};
