import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import type { AuthSessionDto, AuthTokensDto, RememberedUserDto, UserProfileDto } from '@/types/dto';
import type { LoginRequest, RegisterRequest, UpdateMeRequest } from '@/types/requests';

export const authStorageKeys = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  activeUserId: 'activeUserId',
  rememberedUsers: 'rememberedUsers',
} as const;

let refreshPromise: Promise<AuthTokensDto | null> | null = null;
const maxRememberedUsers = 3;

// Хранилище токенов текущей активной сессии.
const saveTokens = async (tokens: AuthTokensDto) => {
  await Promise.all([
    SecureStore.setItemAsync(authStorageKeys.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(authStorageKeys.refreshToken, tokens.refreshToken),
    SecureStore.setItemAsync(authStorageKeys.accessTokenExpiresAt, tokens.expiresAt),
  ]);
};

const clearTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(authStorageKeys.accessToken),
    SecureStore.deleteItemAsync(authStorageKeys.refreshToken),
    SecureStore.deleteItemAsync(authStorageKeys.accessTokenExpiresAt),
    SecureStore.deleteItemAsync(authStorageKeys.activeUserId),
  ]);
};

const getStoredAccessToken = () => SecureStore.getItemAsync(authStorageKeys.accessToken);
const getRefreshToken = () => SecureStore.getItemAsync(authStorageKeys.refreshToken);
const getAccessTokenExpiresAt = () => SecureStore.getItemAsync(authStorageKeys.accessTokenExpiresAt);
const getActiveUserId = () => SecureStore.getItemAsync(authStorageKeys.activeUserId);
const rememberedRefreshTokenKey = (userId: string) => `rememberedRefreshToken_${userId}`;

const getRememberedUsers = async (): Promise<RememberedUserDto[]> => {
  const rawUsers = await SecureStore.getItemAsync(authStorageKeys.rememberedUsers);
  if (!rawUsers) return [];

  try {
    const users = JSON.parse(rawUsers);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
};

const saveRememberedUsers = async (users: RememberedUserDto[]) => {
  await SecureStore.setItemAsync(authStorageKeys.rememberedUsers, JSON.stringify(users));
};

const forgetRememberedUserLocal = async (userId: string) => {
  const rememberedUsers = await getRememberedUsers();
  await Promise.all([
    saveRememberedUsers(rememberedUsers.filter((user) => user.id !== userId)),
    SecureStore.deleteItemAsync(rememberedRefreshTokenKey(userId)),
  ]);
};

const updateRememberedUserLocal = async (user: UserProfileDto) => {
  const rememberedUsers = await getRememberedUsers();
  const existingUser = rememberedUsers.find((item) => item.id === user.id);
  if (!existingUser) return;

  await saveRememberedUsers(
    rememberedUsers.map((item) =>
      item.id === user.id
        ? {
          ...item,
          name: user.name,
          email: item.email,
          avatarFileId: user.avatarFileId,
        }
        : item
    )
  );
};

const revokeRefreshToken = async (refreshToken: string | null) => {
  if (!refreshToken) return;

  try {
    const tokens = await authApi.refresh(refreshToken);
    await authApi.logout(tokens.refreshToken, { authToken: tokens.accessToken });
  } catch {
    // Запомненная сессия уже могла истечь или быть отозвана.
  }
};

const removeRememberedUser = async (userId: string) => {
  const refreshToken = await SecureStore.getItemAsync(rememberedRefreshTokenKey(userId));

  await revokeRefreshToken(refreshToken);
  await forgetRememberedUserLocal(userId);
};

const rememberSession = async (session: AuthSessionDto, email?: string) => {
  await saveTokens(session.tokens);
  await Promise.all([
    SecureStore.setItemAsync(authStorageKeys.activeUserId, session.user.id),
    SecureStore.setItemAsync(rememberedRefreshTokenKey(session.user.id), session.tokens.refreshToken),
  ]);

  const rememberedUsers = await getRememberedUsers();
  const existingUser = rememberedUsers.find((user) => user.id === session.user.id);
  const rememberedUser: RememberedUserDto = {
    id: session.user.id,
    name: session.user.name,
    email: email ?? existingUser?.email ?? '',
    avatarFileId: session.user.avatarFileId,
    lastLoginAt: new Date().toISOString(),
  };
  const nextUsers = [
    rememberedUser,
    ...rememberedUsers.filter((user) => user.id !== session.user.id),
  ].slice(0, maxRememberedUsers);
  const droppedUsers = rememberedUsers.filter((user) => !nextUsers.some((nextUser) => nextUser.id === user.id));
  const droppedRefreshTokens = await Promise.all(
    droppedUsers.map((user) => SecureStore.getItemAsync(rememberedRefreshTokenKey(user.id)))
  );

  await Promise.all([
    saveRememberedUsers(nextUsers),
    ...droppedUsers.map((user) => SecureStore.deleteItemAsync(rememberedRefreshTokenKey(user.id))),
  ]);

  void Promise.all(droppedRefreshTokens.map(revokeRefreshToken));
};

const isTokenFresh = (expiresAt: string | null) => {
  if (!expiresAt) return true;

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) return true;

  return expiresAtMs - Date.now() > 60 * 1000;
};

const refreshTokens = async (): Promise<AuthTokensDto | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const tokens = await authApi.refresh(refreshToken);
      await saveTokens(tokens);
      const activeUserId = await getActiveUserId();
      if (activeUserId) {
        await SecureStore.setItemAsync(rememberedRefreshTokenKey(activeUserId), tokens.refreshToken);
      }
      return tokens;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const getAccessToken = async () => {
  const [accessToken, expiresAt] = await Promise.all([
    getStoredAccessToken(),
    getAccessTokenExpiresAt(),
  ]);

  if (!accessToken) {
    return null;
  }

  if (isTokenFresh(expiresAt)) {
    return accessToken;
  }

  const refreshedTokens = await refreshTokens();
  return refreshedTokens?.accessToken ?? accessToken;
};

export const authRepository = {
  getAccessToken,
  getRefreshToken,

  getCurrentUser: async (): Promise<UserProfileDto | null> => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      return await authApi.getMe({ authToken: accessToken });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const refreshedTokens = await authRepository.refresh();
          if (refreshedTokens?.accessToken) {
            return await authApi.getMe({ authToken: refreshedTokens.accessToken });
          }
        } catch {
          // Ниже очистим невалидную сессию.
        }
      }

      await clearTokens();
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },

  login: async (payload: LoginRequest): Promise<AuthSessionDto> => {
    const session = await authApi.login(payload);
    await rememberSession(session, payload.email.toLowerCase().trim());
    return session;
  },

  register: async (payload: RegisterRequest): Promise<AuthSessionDto> => {
    const session = await authApi.register(payload);
    await rememberSession(session, payload.email.toLowerCase().trim());
    return session;
  },

  loginRemembered: async (userId: string): Promise<AuthSessionDto> => {
    const refreshToken = await SecureStore.getItemAsync(rememberedRefreshTokenKey(userId));
    if (!refreshToken) {
      await removeRememberedUser(userId);
      throw new ApiError(401, 'Login is required.');
    }

    try {
      const tokens = await authApi.refresh(refreshToken);
      await saveTokens(tokens);
      const user = await authApi.getMe({ authToken: tokens.accessToken });
      const session = { user, tokens };
      await rememberSession(session);
      return session;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await removeRememberedUser(userId);
      }

      throw error;
    }
  },

  refresh: async (): Promise<AuthTokensDto | null> => {
    return refreshTokens();
  },

  updateMe: async (payload: UpdateMeRequest): Promise<UserProfileDto> => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new ApiError(401, 'Login is required.');
    }

    const user = await authApi.updateMe(payload, { authToken: accessToken });
    await updateRememberedUserLocal(user);
    return user;
  },

  deleteMe: async () => {
    const [accessToken, activeUserId] = await Promise.all([
      getAccessToken(),
      getActiveUserId(),
    ]);
    if (!accessToken) {
      await clearTokens();
      return;
    }

    try {
      await authApi.deleteMe({ authToken: accessToken });
      if (activeUserId) {
        await forgetRememberedUserLocal(activeUserId);
      }
    } finally {
      await clearTokens();
    }
  },

  logout: async (options?: { revoke?: boolean }) => {
    if (!options?.revoke) {
      await clearTokens();
      return;
    }

    try {
      const [accessToken, refreshToken] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);

      if (accessToken) {
        await authApi.logout(refreshToken, { authToken: accessToken });
      }
    } finally {
      await clearTokens();
    }
  },

  getRememberedUsers,
  removeRememberedUser,
  clearSession: clearTokens,
};
