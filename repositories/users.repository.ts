import { usersApi } from '@/api/users';
import { authRepository } from '@/repositories/authRepository';
import type { UserHistoryQuery } from '@/types/queries';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const usersRepository = {
  profile: async (userId: string) => usersApi.getById(userId, await authConfig()),
  history: async (userId: string, query: UserHistoryQuery) => usersApi.getHistory(userId, query, await authConfig()),
  rating: async (userId: string) => usersApi.getRating(userId, await authConfig()),
  attendanceHistory: async (userId: string) => usersApi.getAttendanceHistory(userId, await authConfig()),
};
