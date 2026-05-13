import { API_BASE_URL } from '@/api/client';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export const getFileUrl = (fileId?: string | null) => {
  if (!fileId) return undefined;
  return `${API_BASE_URL}/files/${fileId}`;
};

export const getFileNameFromUri = (uri: string, fallbackPrefix = 'photo') => {
  const withoutQuery = uri.split('?')[0];
  const name = withoutQuery.split('/').pop();
  if (name && name.includes('.')) {
    return name;
  }
  return `${fallbackPrefix}.jpg`;
};

export const getMimeTypeFromUri = (uri: string) => {
  const name = getFileNameFromUri(uri);
  const extension = name.split('.').pop()?.toLowerCase();
  return extension ? MIME_BY_EXTENSION[extension] ?? 'image/jpeg' : 'image/jpeg';
};

export const isRemoteUri = (uri: string) => /^https?:\/\//i.test(uri);
