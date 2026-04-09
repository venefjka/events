import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { RememberedUser, UserRecord, UserPrivacySettings } from '../types';
import { defaultUserPrivacySettings } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const toRememberedUser = (user: UserRecord): RememberedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  lastLoginAt: new Date().toISOString(),
});

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [localUsers, setLocalUsers] = useState<UserRecord[]>([]);
  const [rememberedUsers, setRememberedUsers] = useState<RememberedUser[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      // TODO(backend): GET /me for current session user
      // For quick login, store only a minimal "remembered users" list + refresh tokens (secure store).
      const [userJson, localUsersJson, rememberedJson, legacyAccountsJson, legacyUsersJson] =
        await Promise.all([
          AsyncStorage.getItem('currentUser'),
          AsyncStorage.getItem('localUsers'),
          AsyncStorage.getItem('rememberedUsers'),
          AsyncStorage.getItem('accounts'),
          AsyncStorage.getItem('users'),
        ]);

      const user = userJson ? JSON.parse(userJson) : null;
      const legacyPayload = legacyUsersJson || legacyAccountsJson;
      const storedLocalUsers = localUsersJson
        ? JSON.parse(localUsersJson)
        : legacyPayload
          ? JSON.parse(legacyPayload)
          : [];

      if (!localUsersJson && legacyPayload) {
        await AsyncStorage.setItem('localUsers', legacyPayload);
      }

      const storedRemembered = rememberedJson
        ? JSON.parse(rememberedJson)
        : (storedLocalUsers || []).map((u: UserRecord) => toRememberedUser(u));

      if (!rememberedJson && storedRemembered.length > 0) {
        await AsyncStorage.setItem('rememberedUsers', JSON.stringify(storedRemembered));
      }

      if (legacyAccountsJson) {
        await AsyncStorage.removeItem('accounts');
      }
      if (legacyUsersJson) {
        await AsyncStorage.removeItem('users');
      }

      return { user, localUsers: storedLocalUsers, rememberedUsers: storedRemembered };
    },
  });

  useEffect(() => {
    if (authQuery.data) {
      setCurrentUser(authQuery.data.user);
      setLocalUsers(authQuery.data.localUsers);
      setRememberedUsers(authQuery.data.rememberedUsers);
      setIsAuthReady(true);
    } else if (authQuery.isError || authQuery.isSuccess) {
      setIsAuthReady(true);
    }
  }, [authQuery.data, authQuery.isError, authQuery.isSuccess]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // TODO(backend): POST /auth/login { email, password }
      // Store access/refresh tokens securely; do NOT store full user list.
      const localUsersJson = await AsyncStorage.getItem('localUsers');
      const existingLocalUsers: UserRecord[] = localUsersJson ? JSON.parse(localUsersJson) : [];

      const user = existingLocalUsers.find(
        (acc) => acc.email === email && acc.password === password
      );

      if (!user) {
        throw new Error('Неверный email или пароль');
      }

      const rememberedEntry = toRememberedUser(user);
      const rememberedJson = await AsyncStorage.getItem('rememberedUsers');
      const existingRemembered: RememberedUser[] = rememberedJson ? JSON.parse(rememberedJson) : [];
      const updatedRemembered = [
        rememberedEntry,
        ...existingRemembered.filter((u) => u.id !== rememberedEntry.id),
      ];

      await Promise.all([
        AsyncStorage.setItem('currentUser', JSON.stringify(user)),
        AsyncStorage.setItem('rememberedUsers', JSON.stringify(updatedRemembered)),
      ]);

      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      setRememberedUsers((prev) => [
        toRememberedUser(user),
        ...prev.filter((u) => u.id !== user.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: Omit<UserRecord, 'id' | 'qrCode' | 'rating' | 'reviews' | 'attendanceHistory'>) => {
      // TODO(backend): POST /auth/register with userData
      // Response should return user + tokens.
      const localUsersJson = await AsyncStorage.getItem('localUsers');
      const existingLocalUsers: UserRecord[] = localUsersJson ? JSON.parse(localUsersJson) : [];

      const emailExists = existingLocalUsers.some((acc) => acc.email === userData.email);
      if (emailExists) {
        throw new Error('Email уже используется');
      }

      const newUser: UserRecord = {
        ...userData,
        id: `user-${Date.now()}`,
        qrCode: `qr-${Date.now()}`,
        rating: 4.5,
        reviews: [],
        attendanceHistory: {
          attended: 0,
          missed: 0,
        },
        privacy: userData.privacy ?? defaultUserPrivacySettings(),
      };

      const updatedLocalUsers = [...existingLocalUsers, newUser];
      const rememberedEntry = toRememberedUser(newUser);
      const updatedRemembered = [
        rememberedEntry,
        ...rememberedUsers.filter((u) => u.id !== rememberedEntry.id),
      ];

      await Promise.all([
        AsyncStorage.setItem('currentUser', JSON.stringify(newUser)),
        AsyncStorage.setItem('localUsers', JSON.stringify(updatedLocalUsers)),
        AsyncStorage.setItem('rememberedUsers', JSON.stringify(updatedRemembered)),
      ]);

      return { user: newUser, localUsers: updatedLocalUsers, rememberedUsers: updatedRemembered };
    },
    onSuccess: ({ user, localUsers: updatedLocalUsers, rememberedUsers: updatedRemembered }) => {
      setCurrentUser(user);
      setLocalUsers(updatedLocalUsers);
      setRememberedUsers(updatedRemembered);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // TODO(backend): POST /auth/logout to revoke session/token
      await AsyncStorage.removeItem('currentUser');
    },
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.clear();
    },
  });

  const switchAccountMutation = useMutation({
    mutationFn: async (user: UserRecord) => {
      // TODO(backend): exchange remembered session token for a new access token.
      const rememberedEntry = toRememberedUser(user);
      const rememberedJson = await AsyncStorage.getItem('rememberedUsers');
      const existingRemembered: RememberedUser[] = rememberedJson ? JSON.parse(rememberedJson) : [];
      const updatedRemembered = [
        rememberedEntry,
        ...existingRemembered.filter((u) => u.id !== rememberedEntry.id),
      ];
      await Promise.all([
        AsyncStorage.setItem('currentUser', JSON.stringify(user)),
        AsyncStorage.setItem('rememberedUsers', JSON.stringify(updatedRemembered)),
      ]);
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      setRememberedUsers((prev) => [
        toRememberedUser(user),
        ...prev.filter((u) => u.id !== user.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      const localUsersJson = await AsyncStorage.getItem('localUsers');
      const existingLocalUsers: UserRecord[] = localUsersJson ? JSON.parse(localUsersJson) : [];

      const updatedLocalUsers = existingLocalUsers.filter((acc) => acc.id !== userId);
      await AsyncStorage.setItem('localUsers', JSON.stringify(updatedLocalUsers));

      const rememberedJson = await AsyncStorage.getItem('rememberedUsers');
      const existingRemembered: RememberedUser[] = rememberedJson ? JSON.parse(rememberedJson) : [];
      const updatedRemembered = existingRemembered.filter((u) => u.id !== userId);
      await AsyncStorage.setItem('rememberedUsers', JSON.stringify(updatedRemembered));

      const currentUserJson = await AsyncStorage.getItem('currentUser');
      const currentUserStored: UserRecord | null = currentUserJson ? JSON.parse(currentUserJson) : null;
      const removedCurrent = currentUserStored?.id === userId;

      if (removedCurrent) {
        await AsyncStorage.removeItem('currentUser');
      }

      return { updatedLocalUsers, updatedRemembered, removedCurrent };
    },
    onSuccess: ({ updatedLocalUsers, updatedRemembered, removedCurrent }) => {
      setLocalUsers(updatedLocalUsers);
      setRememberedUsers(updatedRemembered);
      if (removedCurrent) {
        setCurrentUser(null);
        queryClient.clear();
      }
    },
  });

  const applyUserUpdate = async (
    userId: string,
    updater: (user: UserRecord) => UserRecord
  ) => {
    const updatedLocalUsers = localUsers.map((user) =>
      user.id === userId ? updater(user) : user
    );

    const updatedUser = updatedLocalUsers.find((user) => user.id === userId);
    const updatedRemembered = rememberedUsers.map((user) =>
      user.id === userId && updatedUser
        ? { ...user, name: updatedUser.name, email: updatedUser.email, avatar: updatedUser.avatar }
        : user
    );

    const updatedCurrentUser =
      currentUser?.id === userId
        ? updatedLocalUsers.find((user) => user.id === userId) ?? currentUser
        : currentUser;

    setLocalUsers(updatedLocalUsers);
    setRememberedUsers(updatedRemembered);
    if (updatedCurrentUser !== currentUser) {
      setCurrentUser(updatedCurrentUser);
    }

    await Promise.all([
      AsyncStorage.setItem('localUsers', JSON.stringify(updatedLocalUsers)),
      AsyncStorage.setItem('rememberedUsers', JSON.stringify(updatedRemembered)),
      updatedCurrentUser
        ? AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser))
        : Promise.resolve(),
    ]);
  };

  type EditableUserFields = Pick<
    UserRecord,
    | 'name'
    | 'avatar'
    | 'email'
    | 'password'
    | 'birthDate'
    | 'gender'
    | 'cityPlace'
    | 'interests'
    | 'privacy'
  >;

  const updateUser = async (userId: string, patch: Partial<EditableUserFields>) => {
    await applyUserUpdate(userId, (user) => ({
      ...user,
      ...patch,
    }));
  };

  const updatePrivacy = async (userId: string, patch: Partial<UserPrivacySettings>) => {
    await applyUserUpdate(userId, (user) => ({
      ...user,
      privacy: { ...(user.privacy ?? defaultUserPrivacySettings()), ...patch },
    }));
  };

  const updateUserAttendanceHistory = async (
    userId: string,
    deltas: { attendedDelta?: number; missedDelta?: number }
  ) => {
    const attendedDelta = deltas.attendedDelta ?? 0;
    const missedDelta = deltas.missedDelta ?? 0;

    await applyUserUpdate(userId, (user) => {
      const currentHistory = user.attendanceHistory ?? { attended: 0, missed: 0 };
      const attended = Math.max(0, currentHistory.attended + attendedDelta);
      const missed = Math.max(0, currentHistory.missed + missedDelta);
      return { ...user, attendanceHistory: { attended, missed } };
    });
  };

  return {
    currentUser,
    localUsers,
    rememberedUsers,
    isAuthReady,
    login: (email: string, password: string) => loginMutation.mutate({ email, password }),
    register: (userData: Omit<UserRecord, 'id' | 'qrCode' | 'rating' | 'reviews' | 'attendanceHistory'>) =>
      registerMutation.mutateAsync(userData),
    logout: () => logoutMutation.mutate(),
    switchAccount: (user: UserRecord) => switchAccountMutation.mutate(user),
    deleteAccount: (userId: string) => deleteAccountMutation.mutate(userId),
    updateUser,
    updatePrivacy,
    updateUserAttendanceHistory,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  };
});
