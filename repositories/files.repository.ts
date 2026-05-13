import { filesApi } from '@/api/files';
import { authRepository } from '@/repositories/authRepository';
import type { UploadFileRequest } from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const filesRepository = {
  upload: async (payload: UploadFileRequest) => filesApi.upload(payload, await authConfig()),
  getMany: async (fileIds: string[]) => filesApi.getMany(fileIds, await authConfig()),
  download: async (fileId: string) => filesApi.download(fileId, await authConfig()),
};
