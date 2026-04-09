import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type StoredQrToken = {
  token: string;
  userId: string;
  expiresAt: string;
};

const STORAGE_KEY = 'qrTokens';
const TOKEN_TTL_MS = 60 * 1000;

const nowMs = () => Date.now();

const isExpired = (token: StoredQrToken, now = nowMs()) =>
  new Date(token.expiresAt).getTime() <= now;

const loadTokens = async (): Promise<StoredQrToken[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  return Array.isArray(parsed) ? (parsed as StoredQrToken[]) : [];
};

const saveTokens = async (tokens: StoredQrToken[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
};

const generateToken = (userId: string, now = nowMs()) =>
  `qr:${userId}:${now}:${Math.random().toString(36).slice(2, 10)}`;

export const [QrTokenProvider, useQrTokens] = createContextHook(() => {
  const queryClient = useQueryClient();

  const tokensQuery = useQuery({
    queryKey: ['qrTokens'],
    queryFn: loadTokens,
  });

  const getTokens = async () => tokensQuery.data ?? (await loadTokens());

  const issueToken = async (userId: string) => {
    const now = nowMs();
    const token = generateToken(userId, now);
    const expiresAt = new Date(now + TOKEN_TTL_MS).toISOString();
    const tokens = await getTokens();
    const filtered = tokens.filter(
      (entry) => entry.userId !== userId && !isExpired(entry, now)
    );
    const updated = [...filtered, { token, userId, expiresAt }];
    await saveTokens(updated);
    queryClient.invalidateQueries({ queryKey: ['qrTokens'] });
    return token;
  };

  const getActiveToken = async (userId: string) => {
    const now = nowMs();
    const tokens = await getTokens();
    const active = tokens.find((entry) => entry.userId === userId && !isExpired(entry, now));
    return active?.token ?? null;
  };

  const getOrCreateToken = async (userId: string) => {
    const active = await getActiveToken(userId);
    if (active) return active;
    return issueToken(userId);
  };

  const resolveToken = async (token: string) => {
    const now = nowMs();
    const tokens = await getTokens();
    const entry = tokens.find((stored) => stored.token === token);
    if (!entry || isExpired(entry, now)) return null;
    return entry.userId;
  };

  return {
    tokenTtlMs: TOKEN_TTL_MS,
    issueToken,
    getActiveToken,
    getOrCreateToken,
    resolveToken,
  };
});
