import React, { useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Camera, ScanLine } from 'lucide-react-native';
import { qrApi } from '@/api/qr';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQrTokens } from '@/contexts/QrTokenContext';
import { useUsers } from '@/contexts/UsersContext';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/themes/useTheme';
import { extractQrPayload, extractQrToken } from '@/utils/qr';
import { formatActivityDate } from '@/utils/date';

export default function QRScanScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { markAttendance, getParticipationStatus } = useActivityParticipation();
  const { resolveToken } = useQrTokens();
  const { users, getUserById } = useUsers();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [manualCode, setManualCode] = useState('');
  const [isScanLocked, setIsScanLocked] = useState(false);
  const lastProcessedCameraValueRef = useRef<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const resolvedActivityId = Array.isArray(activityId) ? activityId[0] : activityId;
  const activity = resolvedActivityId
    ? allActivities.find((item) => item.id === resolvedActivityId)
    : null;

  if (!currentUser) {
    router.back();
    return null;
  }

  const showScanAlert = (title: string, message: string) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () => setIsScanLocked(false),
        },
      ],
      {
        cancelable: false,
        onDismiss: () => setIsScanLocked(false),
      }
    );
  };

  const resolveScannedUserId = async (rawValue: string) => {
    if (!activity) return null;

    const payload = extractQrPayload(rawValue);
    if (payload?.activityId && payload.activityId !== activity.id) {
      return null;
    }

    const token = extractQrToken(rawValue);
    if (!token) return null;

    const localResolvedUserId = await resolveToken(token, activity.id);
    if (localResolvedUserId) return localResolvedUserId;

    if (
      payload?.activityId === activity.id &&
      typeof payload.userId === 'string' &&
      payload.userId.trim()
    ) {
      return payload.userId.trim();
    }

    try {
      const response = await qrApi.resolveToken({ token });
      return response.user.id;
    } catch {
      const legacyUser = users.find((user) => user.qrCode === token);
      return legacyUser?.id ?? null;
    }
  };

  const handleAttendance = async (rawValue: string) => {
    if (!activity) return;

    const token = extractQrToken(rawValue);
    const userId = await resolveScannedUserId(rawValue);
    const participant = userId ? getUserById(userId) : null;
    const status = userId ? getParticipationStatus(activity.id, userId) : null;

    if (!userId) {
      showScanAlert('Ошибка', 'Не удалось распознать код участника или QR относится к другому событию.');
      return;
    }

    const isAlreadyAttended =
      status === 'attended' || activity.attendedUsers.includes(userId);
    const isRegisteredParticipant =
      status === 'accepted' ||
      isAlreadyAttended ||
      (userId !== activity.organizer.id &&
        activity.currentParticipants.some((user) => user.id === userId));

    if (!isRegisteredParticipant) {
      showScanAlert('Ошибка', 'Пользователь не зарегистрирован на это мероприятие.');
      return;
    }

    if (isAlreadyAttended) {
      showScanAlert('Уже отмечен', 'Посещение уже отмечено для этого участника.');
      return;
    }

    if (token) {
      try {
        await qrApi.scanAttendance(activity.id, { token });
      } catch {
        // TODO(api): keep local fallback until backend flow is final.
      }
    }

    await markAttendance(activity.id, userId);
    setManualCode('');
    showScanAlert('Успешно', `Посещение отмечено для ${participant?.name ?? userId}.`);
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (isScanLocked) return;
    if (lastProcessedCameraValueRef.current === data) return;

    lastProcessedCameraValueRef.current = data;
    setIsScanLocked(true);

    await handleAttendance(data);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Ошибка', 'Введите код участника.');
      return;
    }

    try {
      await handleAttendance(manualCode.trim());
    } finally {
      setManualCode('');
    }
  };

  if (!resolvedActivityId || !activity || activity.organizer.id !== currentUser.id) {
    return <Redirect href="/qr?mode=organizer" />;
  }

  const cameraPermissionGranted = permission?.granted ?? false;
  const attendeesCount = Math.max(
    0,
    activity.attendedUsers.filter((userId) => userId !== activity.organizer.id).length
  );
  const expectedAttendeesCount = Math.max(0, activity.currentParticipants.length - 1);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <Header
            showBackButton
            title="QR-сканер"
            onBackPress={() => router.back()}
            borderBottom={false}
          />
        </SafeAreaView>

        <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
          <KeyboardAwareScrollView
            style={styles.keyboardAwareScroll}
            contentContainerStyle={styles.keyboardAwareContent}
            enableOnAndroid
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.content}>
              <View style={styles.topMeta}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityMeta, { color: theme.colors.textSecondary }]}>
                  {formatActivityDate(activity.startAt)}
                </Text>
                <Text style={[styles.activityMeta, { color: theme.colors.textSecondary }]}>
                  Отмечено участников: {attendeesCount}/{expectedAttendeesCount}
                </Text>
              </View>

              {!permission ? (
                <View style={styles.placeholder}>
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                    Проверяем доступ к камере...
                  </Text>
                </View>
              ) : cameraPermissionGranted ? (
                <View style={styles.cameraFrame}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={isScanLocked ? undefined : handleBarcodeScanned}
                  />
                  <View style={styles.cameraOverlay}>
                    <View style={styles.scanWindow} />
                    <Text style={styles.scanHintText}>Наведите камеру на QR-код участника</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <ScanLine
                    size={theme.spacing.iconSizeXXLarge}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
                    Нужен доступ к камере, чтобы начать сканирование
                  </Text>
                  <Button
                    title={'Запросить доступ'}
                    variant="primary"
                    size="small"
                    onPress={() => void requestPermission()}
                  />
                </View>
              )}

              <View style={styles.manualSection}>
                <Input
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="Вставьте токен или QR payload"
                  autoCapitalize="none"
                />
                <Button
                  title="Отметить по коду"
                  variant="primary"
                  size="medium"
                  fullWidth
                  onPress={() => void handleManualSubmit()}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>
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
    keyboardAwareScroll: {
      flex: 1,
    },
    keyboardAwareContent: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.xxl * 2,
    },
    topMeta: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    activityTitle: {
      ...theme.typography.bodyLargeBold,
      textAlign: 'center',
    },
    activityMeta: {
      ...theme.typography.body,
      textAlign: 'center',
    },
    cameraFrame: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: theme.spacing.radiusXLarge,
      backgroundColor: '#000',
      aspectRatio: 1,
    },
    cameraOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.24)',
      gap: theme.spacing.lg,
      padding: theme.spacing.xl,
    },
    scanWindow: {
      width: '74%',
      height: '74%',
      borderRadius: theme.spacing.radiusLarge,
      borderWidth: theme.spacing.borderWidthThick,
      borderColor: '#FFFFFF',
      backgroundColor: 'transparent',
    },
    scanHintText: {
      color: '#FFFFFF',
      textAlign: 'center',
      ...theme.typography.body,
    },
    placeholder: {
      minHeight: 280,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderWidth: theme.spacing.borderWidth,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: theme.spacing.radiusXLarge,
    },
    placeholderTitle: {
      ...theme.typography.bodyLargeBold,
      textAlign: 'center',
    },
    helperText: {
      ...theme.typography.body,
      lineHeight: 22,
      textAlign: 'center',
    },
    manualSection: {
      gap: theme.spacing.lg,
    },
  });
