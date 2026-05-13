import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    LogOut,
    Users,
    QrCode,
    Bell,
    Palette,
    HelpCircle,
    ChevronRight,
    AtSign,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import { getAgeLabel } from '@/utils/user';
import { getFileUrl } from '@/utils/files';

export default function ProfileScreen() {
    const { currentUser, logout } = useAuth();
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);
    const userAge = currentUser?.age;
    const avatarUri = getFileUrl(currentUser?.avatarFileId);
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
                    paddingVertical: theme.spacing.sm,
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
                    <Text style={{
                        ...theme.typography.body,
                        color: theme.colors.text,
                    }}>{item.label}</Text>
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
            icon: <AtSign />,
            onPress: () => router.push(`/user/${currentUser!.id}`),
        },
        {
            key: 'subscriptions',
            label: 'Подписки',
            icon: <Users />,
            onPress: () => router.push('/subscriptions'),
        },
        {
            key: 'qr',
            label: 'QR',
            icon: <QrCode />,
            onPress: () => router.push('/qr?mode=participant'),
        },
    ];

    const settingsItems: MenuItemConfig[] = [
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

    const showLogoutAlert = () => {
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
    };

    if (!currentUser) {
        return null;
    }

    return (
        <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <Header
                title="Профиль"
                rightButtons={[{
                    icon: <LogOut size={theme.spacing.iconSize * 0.9} />,
                    onPress: showLogoutAlert,
                    variant: 'surface',
                }]}
            />

            <ScrollView style={[commonStyles.content, { backgroundColor: theme.colors.surface }]} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileCard, {
                    borderBottomColor: theme.colors.surface,
                    paddingVertical: theme.spacing.xxxl,
                    backgroundColor: theme.colors.surface,
                }]}>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        activeOpacity={0.8}
                    >
                        <Avatar name={currentUser.name} size="large" imageUrl={avatarUri} />
                    </TouchableOpacity>
                    <Text style={{
                        ...theme.typography.h4,
                        color: theme.colors.text,
                        marginTop: theme.spacing.md,
                        marginBottom: theme.spacing.xs,
                        textAlign: 'center'
                    }}>{currentUser.name}</Text>
                    {typeof userAge === 'number' && (
                        <Text style={{
                            ...theme.typography.body,
                            color: theme.colors.textSecondary,
                        }}>{userAge} {getAgeLabel(userAge)}, {currentUser.city.settlement}</Text>
                    )}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider,
                    paddingVertical: theme.spacing.xs,
                    backgroundColor: theme.colors.background,
                }]}>
                    {profileItems.map((item, index) => renderMenuItem(item, index, profileItems.length))}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider,
                    paddingVertical: theme.spacing.xs,
                    backgroundColor: theme.colors.background,
                }]}>
                    <Text style={{
                        ...theme.typography.overline,
                        color: theme.colors.textTertiary,
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingTop: theme.spacing.md - 2,
                        paddingBottom: theme.spacing.xs,
                    }}>Настройки</Text>

                    {settingsItems.map((item, index) => renderMenuItem(item, index, settingsItems.length))}
                </View>

                <View style={[styles.section, {
                    borderBottomColor: theme.colors.surface,
                    borderBottomWidth: theme.spacing.sectionDivider * 4,
                    paddingVertical: theme.spacing.xs,
                    backgroundColor: theme.colors.background,
                }]}>
                    <Text style={{
                        ...theme.typography.overline,
                        color: theme.colors.textTertiary,
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingTop: theme.spacing.md - 2,
                        paddingBottom: theme.spacing.xs,
                    }}>Помощь</Text>

                    {helpItems.map((item, index) => renderMenuItem(item, index, helpItems.length))}
                </View>
            </ScrollView>
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
    section: {
        paddingVertical: 8,
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
        height: 1,
    },
});
