import type { FileDto } from '@/types/dto';
import type { RequestConfig, UploadFileRequest } from './types';
import { API_BASE_URL, ApiError, apiRequest } from './client';
import { buildQueryString } from './helpers';

export interface FilesResponse {
  items: FileDto[];
}

export const filesApi = {
  upload: (payload: UploadFileRequest, config?: RequestConfig) => {
    const body = new FormData();
    body.append('file', {
      uri: payload.uri,
      name: payload.name,
      type: payload.mimeType,
    } as unknown as Blob);

    return apiRequest<FileDto>(
      '/files',
      { method: 'POST', body, signal: config?.signal },
      config?.authToken
    );
  },

  download: async (fileId: string, config?: RequestConfig) => {
    const headers: Record<string, string> = {};
    if (config?.authToken) {
      headers.Authorization = `Bearer ${config.authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'GET',
      headers,
      signal: config?.signal,
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.blob();
  },

  getMany: (fileIds: string[], config?: RequestConfig) =>
    apiRequest<FilesResponse>(
      `/files${buildQueryString({ ids: fileIds.join(',') })}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),
};
