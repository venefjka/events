import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
    Settings,
    LogOut,
    Users,
    QrCode,
    UserCheck,
    Lock,
    Bell,
    Palette,
    HelpCircle,
    ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import { getUserAge } from '@/utils/user';

export default function ProfileScreen() {
    const { currentUser, logout, updateUser } = useAuth();
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);
    const [showSettings, setShowSettings] = useState(false);
    const userAge = getUserAge(currentUser?.birthDate);
    const iconBoxSize = 40;
    const separatorInset = theme.spacing.screenPaddingHorizontal + iconBoxSize + 16;

    type MenuItemConfig = {
        key: string;
        label: string;
        icon: React.ReactElement<{ size?: number; color?: string }>;
        onPress?: () => void;
    };

    const renderMenuItem = (item: MenuItemConfig, index: number, total: number) => (
        <View key={item.key}>
            <TouchableOpacity
                style={[styles.menuItem, {
                    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                    paddingVertical: theme.spacing.lg,
                }]}
                onPress={item.onPress}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIcon, {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderRadius: theme.spacing.radiusRound,
                        width: iconBoxSize,
                        height: iconBoxSize,
                    }]}>
                        {React.cloneElement(item.icon, {
                            size: theme.spacing.iconSize,
                            color: theme.colors.text,
                        })}
                    </View>
                    <Text style={[styles.menuItemText, {
                        ...theme.typography.bodyBold,
                        color: theme.colors.text,
                    }]}>{item.label}</Text>
                </View>
                <ChevronRight size={theme.spacing.iconSize} color={theme.colors.textTertiary} />
            </TouchableOpacity>
            {index < total - 1 && (
                <View style={[styles.menuItemSeparator, {
                    marginLeft: separatorInset,
                    backgroundColor: theme.colors.dividerLight,
                }]} />
            )}
        </View>
    );

    const profileItems: MenuItemConfig[] = [
        {
            key: 'profile',
            label: 'Мой профиль',
            icon: <Users />,
            onPress: () => router.push(`/user/${currentUser!.id}`),
        },
        {
            key: 'qr',
            label: 'Мой QR',
            icon: <QrCode />,
            onPress: () => router.push('/my-qr'),
        },
        {
            key: 'subscriptions',
            label: 'Мои подписки',
            icon: <UserCheck />,
            onPress: () => router.push('/subscriptions'),
        },
    ];

    const settingsItems: MenuItemConfig[] = [
        {
            key: 'privacy',
            label: 'Конфиденциальность',
            icon: <Lock />,
        },
        {
            key: 'notifications',
            label: 'Уведомления',
            icon: <Bell />,
        },
        {
            key: 'theme',
            label: 'Оформление',
            icon: <Palette />,
        },
    ];

    const helpItems: MenuItemConfig[] = [
        {
            key: 'help',
            label: 'Справка',
            icon: <HelpCircle />,
        },
    ];

    const handleAvatarPress = useCallback(async () => {
        if (!currentUser) return;

        const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!existingPermission.granted) {
            const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!requested.granted) {
                Alert.alert('Доступ к фото', 'Разрешите доступ к фото, чтобы выбрать аватар.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                await updateUser(currentUser.id, { avatar: uri });
            }
        }
    }, [currentUser, updateUser]);

    if (!currentUser) {
        return null;
    }

    return (
        <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <Header
                title="Профиль"
                rightButtons={[{
                    icon: <Settings size={theme.spacing.iconSize} />,
                    onPress: () => setShowSettings(true),
                    variant: 'surface',
                }]}
                // borderBottom={false}
            />

            <ScrollView style={[commonStyles.content, { backgroundColor: theme.colors.surface }]} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileCard, {
                    borderBottomColor: theme.colors.surface,
                    // borderBottomWidth: theme.spacing.sectionDivider,
                    paddingVertical: theme.spacing.xxxl,
                    backgroundColor: theme.colors.surface,
                }]}>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        activeOpacity={0.8}
                        onPress={handleAvatarPress}
                    >
                        <Avatar name={currentUser.name} size="large" imageUrl={currentUser.avatar} />
                    </TouchableOpacity>
                    <Text style={[styles.name, {
                        ...theme.typography.h4,
                        color: theme.colors.text,
                        marginTop: theme.spacing.md,
                        marginBottom: theme.spacing.xs,
                    }]}>{currentUser.name}</Text>
                    {typeof userAge === 'number' && (
                        <Text style={[styles.age, {
                            ...theme.typography.body,
                            color: theme.colors.textSecondary,
                            // marginBottom: theme.spacing.md,
                        }]}>{userAge} года, {currentUser.cityPlace?.settlement}</Text>
                    )}

                    {/* <Rating rating={currentUser.rating} size={16} variant="compact" /> */}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: theme.colors.background,
                }]}>
                    {profileItems.map((item, index) => renderMenuItem(item, index, profileItems.length))}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: theme.colors.background,
                }]}>
                    <Text style={[styles.sectionTitle, {
                        ...theme.typography.overline,
                        color: theme.colors.textTertiary,
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingTop: theme.spacing.lg,
                        paddingBottom: theme.spacing.sm,
                    }]}>Настройки</Text>

                    {settingsItems.map((item, index) => renderMenuItem(item, index, settingsItems.length))}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider * 4,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: theme.colors.background,
                }]}>
                    <Text style={[styles.sectionTitle, {
                        ...theme.typography.overline,
                        color: theme.colors.textTertiary,
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingTop: theme.spacing.lg,
                        paddingBottom: theme.spacing.sm,
                    }]}>Помощь</Text>

                    {helpItems.map((item, index) => renderMenuItem(item, index, helpItems.length))}
                </View>
            </ScrollView>

            <Modal
                visible={showSettings}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettings(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <View style={styles.settingsModalContainer}>
                        <Card variant="elevated" padding="large" style={{
                            backgroundColor: theme.colors.background,
                            borderRadius: theme.spacing.radiusLarge,
                            maxWidth: 400,
                            width: '100%',
                        }}>
                            <Text style={[styles.settingsTitle, {
                                ...theme.typography.h3,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.xl,
                            }]}>Настройки</Text>

                            <TouchableOpacity
                                style={[styles.settingsOption, {
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.spacing.radius,
                                    paddingVertical: theme.spacing.lg,
                                    paddingHorizontal: theme.spacing.md,
                                    marginBottom: theme.spacing.md,
                                }]}
                                onPress={() => {
                                    setShowSettings(false);
                                    Alert.alert(
                                        'Выход',
                                        'Вы уверены?',
                                        [
                                            { text: 'Отмена', style: 'cancel' },
                                            {
                                                text: 'Выйти',
                                                style: 'destructive',
                                                onPress: logout,
                                            },
                                        ]
                                    );
                                }}
                            >
                                <LogOut size={theme.spacing.iconSize} color={theme.colors.error} />
                                <Text style={[styles.settingsOptionText, {
                                    ...theme.typography.bodyBold,
                                    color: theme.colors.error,
                                    marginLeft: theme.spacing.md,
                                }]}>Выйти</Text>
                            </TouchableOpacity>

                            <Button
                                title="Отмена"
                                onPress={() => setShowSettings(false)}
                                variant="ghost"
                                size="medium"
                                fullWidth
                            />
                        </Card>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    profileCard: {
        alignItems: 'center',
    },
    avatarButton: {
        borderRadius: 999,
    },
    name: {
        fontSize: 22,
    },
    age: {
        fontSize: 15,
    },
    section: {
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 13,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuItemIcon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemSeparator: {
        height: StyleSheet.hairlineWidth,
    },
    menuItemText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    settingsModalContainer: {
        width: '100%',
        maxWidth: 400,
    },
    settingsModal: {
        width: '100%',
    },
    settingsTitle: {
        fontSize: 22,
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsOptionText: {
        fontSize: 16,
    },
});


