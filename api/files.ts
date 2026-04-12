import type { FileDto } from '@/types/dto';
import type { RequestConfig, UploadFileRequest } from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const filesApi = {
  upload: (payload: UploadFileRequest, config?: RequestConfig) =>
    apiRequest<FileDto>(
      '/files',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),

  getById: (fileId: string, config?: RequestConfig) =>
    apiRequest<FileDto>(`/files/${fileId}`, { method: 'GET', signal: config?.signal }, config?.authToken),

  getMany: (fileIds: string[], config?: RequestConfig) =>
    apiRequest<FileDto[]>(
      `/files${buildQueryString({ ids: fileIds })}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),
};
