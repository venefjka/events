import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCcw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/ui/Header';
import { useTheme } from '@/themes/useTheme';
import { createQrPayload } from '@/utils/qr';
import { useActivityDetails } from '@/hooks/queries/useActivityDetails';
import { useMyQrToken } from '@/hooks/queries/useMyQrToken';
import { useRefreshQrToken } from '@/hooks/mutations/useRefreshQrToken';

export default function MyQRScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const resolvedActivityId = Array.isArray(activityId) ? activityId[0] : activityId;
  const { currentUser } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const activityQuery = useActivityDetails(resolvedActivityId);
  const tokenQuery = useMyQrToken(Boolean(currentUser && resolvedActivityId));
  const refreshQrToken = useRefreshQrToken();
  const activity = activityQuery.data ?? null;

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

  const token = tokenQuery.data?.token ?? '';
  const qrValue =
    token && resolvedActivityId ? createQrPayload(token, currentUser.id, resolvedActivityId) : '';

  const handleRefresh = async () => {
    if (!resolvedActivityId) return;
    await refreshQrToken.mutateAsync();
    await tokenQuery.refetch();
    setIsCodeCopied(false);
  };

  const handleCopyCode = async () => {
    if (!token) return;
    await Clipboard.setStringAsync(token);
    setIsCodeCopied(true);
  };

  if (!resolvedActivityId || (!activityQuery.isLoading && !activity)) {
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
                  {activity?.title ?? ''}
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
