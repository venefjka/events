import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, X } from 'lucide-react-native';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQrTokens } from '@/contexts/QrTokenContext';
import { useTheme } from '@/themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';

// todo: сделать с нуля

export default function QRScanScreen() {
    const { activityId } = useLocalSearchParams<{ activityId?: string }>();
    const { currentUser, localUsers } = useAuth();
    const { allActivities } = useActivities();
    const { markAttendance, getParticipationStatus } = useActivityParticipation();
    const { resolveToken } = useQrTokens();
    const theme = useTheme();
    const [manualCode, setManualCode] = useState('');
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(activityId || null);

    const userCreatedActivities = allActivities.filter((a) => a.organizer.id === currentUser?.id);
    const activity = selectedActivityId ? allActivities.find((a) => a.id === selectedActivityId) : null;

    if (!currentUser) {
        router.back();
        return null;
    }


    const handleScanCode = async (code: string) => {
        if (activity) {
            const resolvedUserId = await resolveToken(code);
            const legacyUser = localUsers.find((user) => user.qrCode === code);
            const userId = resolvedUserId ?? legacyUser?.id;
            const participant = localUsers.find((user) => user.id === userId);

            if (!userId) {
                Alert.alert('Ошибка', 'Пользователь не зарегистрирован на эту активность');
                return;
            }

            const status = getParticipationStatus(activity.id, userId);
            if (status !== 'accepted' && status !== 'attended') {
                Alert.alert('Ошибка', 'Пользователь не зарегистрирован на эту активность');
                return;
            }
            if (status === 'attended') {
                Alert.alert('Внимание', 'Посещение уже отмечено для этого участника');
                return;
            }

            markAttendance(activity.id, userId);
            Alert.alert(
                'Успешно',
                `Посещение отмечено для ${participant?.name ?? userId}`,
                [{ text: 'OK' }]
            );
            setManualCode('');
        }
    };

    const handleManualInput = () => {
        if (!manualCode.trim()) {
            Alert.alert('Ошибка', 'Введите код участника');
            return;
        }
        handleScanCode(manualCode.trim());
    };


    if (!selectedActivityId) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <SafeAreaView style={styles.container} edges={['top']}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                            <X size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Выберите мероприятие</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView style={styles.content}>
                        <Text style={styles.selectTitle}>Ваши мероприятия</Text>
                        <Text style={styles.selectSubtitle}>
                            Выберите мероприятие для отметки посещаемости
                        </Text>

                        {userCreatedActivities.length > 0 ? (
                            userCreatedActivities.map((act) => (
                                <TouchableOpacity
                                    key={act.id}
                                    style={styles.activitySelectCard}
                                    onPress={() => setSelectedActivityId(act.id)}
                                >
                                    <View style={styles.activitySelectIcon}>
                                        {renderCategoryIcon(act.category, theme.spacing.iconSizeXLarge)}
                                    </View>
                                    <View style={styles.activitySelectInfo}>
                                        <Text style={styles.activitySelectTitle}>{act.title}</Text>
                                        <Text style={styles.activitySelectTime}>
                                            {new Date(act.startAt).toLocaleString('ru', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                        <Text style={styles.activitySelectStats}>
                                            {act.currentParticipants.length} зарегистрировано • {act.attendedUsers.length} отмечено
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateIcon}>📅</Text>
                                <Text style={styles.emptyStateText}>У вас нет созданных мероприятий</Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </>
        );
    }

    if (!activity) {
        router.back();
        return null;
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            if (activityId) {
                                router.back();
                            } else {
                                setSelectedActivityId(null);
                            }
                        }}
                    >
                        <X size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Отметить посещение</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.content}>
                    <View style={styles.activityCard}>
                        <View style={styles.activityIcon}>
                            {renderCategoryIcon(activity.category, theme.spacing.iconSizeLarge * 2)}
                        </View>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>
                            {new Date(activity.startAt).toLocaleString('ru', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    <View style={styles.scanArea}>
                        <View style={styles.qrPlaceholder}>
                            <QrCode size={120} color="#000" />
                            <Text style={styles.qrPlaceholderText}>
                                Камера сканирования QR-кода
                            </Text>
                            <Text style={styles.qrPlaceholderSubtext}>
                                (Требует нативной реализации)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>или</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.manualInput}>
                        <Text style={styles.manualInputLabel}>Ввести код вручную</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="user-X-qr"
                            placeholderTextColor="#999"
                            value={manualCode}
                            onChangeText={setManualCode}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.submitButton} onPress={handleManualInput}>
                            <Text style={styles.submitButtonText}>Отметить посещение</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.stats}>
                        <Text style={styles.statsTitle}>Статистика</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{activity.currentParticipants.length}</Text>
                                <Text style={styles.statLabel}>Зарегистрировано</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{activity.attendedUsers.length}</Text>
                                <Text style={styles.statLabel}>Отмечено</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, styles.statValuePending]}>
                                    {activity.currentParticipants.length - activity.attendedUsers.length}
                                </Text>
                                <Text style={styles.statLabel}>Ожидается</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    placeholder: {
        width: 40,
    },
    selectTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    selectSubtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
    },
    activitySelectCard: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    activitySelectIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activitySelectInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    activitySelectTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    activitySelectTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    activitySelectStats: {
        fontSize: 13,
        color: '#999',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    activityCard: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        marginBottom: 24,
    },
    activityIcon: {
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
        textAlign: 'center',
    },
    activityTime: {
        fontSize: 14,
        color: '#666',
    },
    scanArea: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrPlaceholder: {
        width: 250,
        height: 250,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e5e5e5',
        borderStyle: 'dashed',
    },
    qrPlaceholderText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    qrPlaceholderSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e5e5',
    },
    dividerText: {
        fontSize: 14,
        color: '#999',
        marginHorizontal: 16,
    },
    manualInput: {
        marginBottom: 24,
    },
    manualInputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#000',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        marginBottom: 12,
    },
    submitButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    stats: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    statValuePending: {
        color: '#999',
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
    },
});

