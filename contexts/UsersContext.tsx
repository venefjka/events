import createContextHook from '@nkzw/create-context-hook';
import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { UserPublic, UserRecord } from '@/types';
import { buildUserPublic } from '@/utils/user';

export const [UsersProvider, useUsers] = createContextHook(() => {
  const { currentUser, localUsers } = useAuth();

  const users = useMemo(() => {
    const list = [...localUsers];
    if (currentUser && !list.some((user) => user.id === currentUser.id)) {
      list.push(currentUser);
    }
    return list;
  }, [currentUser, localUsers]);

  const usersMap = useMemo(
    () => new Map<string, UserRecord>(users.map((user) => [user.id, user])),
    [users]
  );

  const getUserById = (userId: string) => usersMap.get(userId) ?? null;

  const getUserPublic = (
    userId: string,
    options?: { viewerId?: string; attendanceHistory?: { attended: number; missed: number } }
  ): UserPublic | null => {
    const user = getUserById(userId);
    if (!user) return null;
    return buildUserPublic(user, options?.viewerId ?? currentUser?.id, options?.attendanceHistory);
  };

  return {
    users,
    usersMap,
    getUserById,
    getUserPublic,
  };
});
