import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCcw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQrTokens } from '@/contexts/QrTokenContext';
import { Header } from '@/components/ui/Header';
import { useTheme } from '@/themes/useTheme';
import { createQrPayload } from '@/utils/qr';

export default function MyQRScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const resolvedActivityId = Array.isArray(activityId) ? activityId[0] : activityId;
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { getUserActivityIdsByStatus } = useActivityParticipation();
  const { getOrCreateToken, issueToken, tokenTtlMs } = useQrTokens();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const availableActivityIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(getUserActivityIdsByStatus(currentUser.id, ['accepted']));
  }, [currentUser, getUserActivityIdsByStatus]);

  const activity = resolvedActivityId
    ? allActivities.find((item) => item.id === resolvedActivityId)
    : null;

  const tokenQuery = useQuery({
    queryKey: ['qrToken', currentUser?.id, resolvedActivityId],
    queryFn: async () => {
      if (!currentUser || !resolvedActivityId) return '';
      return getOrCreateToken(currentUser.id, resolvedActivityId);
    },
    enabled: Boolean(currentUser && resolvedActivityId && availableActivityIds.has(resolvedActivityId)),
    staleTime: tokenTtlMs,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: Math.max(15000, Math.floor(tokenTtlMs * 0.8)),
  });

  useEffect(() => {
    if (!isCodeCopied) return;

    const timeoutId = setTimeout(() => {
      setIsCodeCopied(false);
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [isCodeCopied]);

  if (!currentUser) {
    router.back();
    return null;
  }

  const token = tokenQuery.data ?? '';
  const qrValue =
    token && resolvedActivityId ? createQrPayload(token, currentUser.id, resolvedActivityId) : '';

  const handleRefresh = async () => {
    if (!resolvedActivityId || !availableActivityIds.has(resolvedActivityId)) return;
    await issueToken(currentUser.id, resolvedActivityId);
    await tokenQuery.refetch();
    setIsCodeCopied(false);
  };

  const handleCopyCode = async () => {
    if (!token) return;
    await Clipboard.setStringAsync(token);
    setIsCodeCopied(true);
  };

  if (!resolvedActivityId || !activity || !availableActivityIds.has(resolvedActivityId)) {
    return <Redirect href="/qr?mode=participant" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <Header
            showBackButton
            title="Мой QR"
            rightButtons={[
              {
                icon: <RefreshCcw size={theme.spacing.iconSize} />,
                onPress: () => void handleRefresh(),
                variant: 'simple',
              },
            ]}
            borderBottom={false}
          />
        </SafeAreaView>

        <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
          <View style={styles.content}>
            {tokenQuery.isPending && !qrValue ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Генерируем QR-код
                </Text>
              </View>
            ) : (
              <View style={styles.qrBlock}>
                <View style={styles.qrCanvas}>
                  {qrValue ? (
                    <QRCode
                      value={qrValue}
                      size={220}
                      color={theme.colors.text}
                      backgroundColor={theme.colors.background}
                    />
                  ) : null}
                </View>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.qrHint, { color: theme.colors.textSecondary }]}>
                  Данный QR-код будет действителен в течение одной минуты
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => void handleCopyCode()}
              disabled={!token}
              style={({ pressed }) => [
                styles.codeSection,
                {
                  borderColor: isCodeCopied ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.background,
                  opacity: pressed && token ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.codeText, { color: theme.colors.text }]}>
                {token || 'Код появится после генерации'}
              </Text>
              <Text
                style={[
                  styles.codeHint,
                  { color: isCodeCopied ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {token ? (isCodeCopied ? 'Скопировано' : 'Нажмите, чтобы скопировать') : ' '}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerSafeArea: {
      zIndex: 10,
    },
    contentSafeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingVertical: theme.spacing.xl,
    },
    qrBlock: {
      width: '100%',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xxxl * 2,
    },
    qrCanvas: {
      borderRadius: theme.spacing.radiusLarge,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    activityTitle: {
      ...theme.typography.bodyLargeBold,
      textAlign: 'center',
      maxWidth: 320,
    },
    qrHint: {
      ...theme.typography.body,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 320,
    },
    loadingBlock: {
      minHeight: 260,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    loadingText: {
      ...theme.typography.body,
    },
    codeSection: {
      borderRadius: theme.spacing.radius,
      borderWidth: theme.spacing.borderWidth,
      borderStyle: 'dashed',
      padding: theme.spacing.lg,
      minWidth: 260,
    },
    codeText: {
      ...theme.typography.bodyBold,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    codeHint: {
      ...theme.typography.caption,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });
