import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/themes/useTheme';
import { ChevronLeft, Filter, Bell, Menu, X, Plus, Search as SearchIcon } from 'lucide-react-native';

export type HeaderButton = {
    icon: ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'surface' | 'simple';
};

export type HeaderProps = {
    title?: string;
    leftButtons?: HeaderButton[];
    rightButtons?: HeaderButton[];
    showBackButton?: boolean;
    onBackPress?: () => void;
    backgroundColor?: string;
    borderBottom?: boolean;
    alignLeftIfNoLeftButtons?: boolean;
    heightVariant?: 'default' | 'short';
};

export const Header: React.FC<HeaderProps> = ({
    title,
    leftButtons = [],
    rightButtons = [],
    showBackButton = false,
    onBackPress,
    backgroundColor,
    borderBottom = true,
    alignLeftIfNoLeftButtons = true,
    heightVariant = 'default',
}) => {
    const theme = useTheme();

    const allLeftButtons = [
        ...(showBackButton ? [HeaderButtons.back(onBackPress)] : []),
        ...leftButtons,
    ];

    const hasLeftButtons = allLeftButtons.length > 0;
    const titleAlignment = !hasLeftButtons && alignLeftIfNoLeftButtons ? 'flex-start' : 'center';

    const renderButton = (button: HeaderButton, index: number, isLeft: boolean) => {
        const variantStyle = {
            primary: {
                backgroundColor: theme.colors.primary,
            },
            secondary: {
                backgroundColor: theme.colors.secondary,
            },
            surface: {
                backgroundColor: theme.colors.surfaceVariant,
            },
            simple: {
                backgroundColor: "transparent",
                width: 'auto'
            }
        };

        return (
            <TouchableOpacity
                key={`${isLeft ? 'left' : 'right'}-${index}`}
                style={[
                    styles.button,
                    {
                        borderRadius: theme.spacing.radiusRound,
                        width: theme.spacing.iconButtonHeight,
                        height: theme.spacing.iconButtonHeight,
                    },
                    variantStyle[button.variant || 'surface'],
                ]}
                onPress={button.onPress}
            >
                {React.cloneElement(button.icon as React.ReactElement<any>, {
                    color: button.variant === "primary" ? theme.colors.textInverse : theme.colors.text,
                })}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            styles.header,
            {
                borderBottomColor: borderBottom ? theme.colors.border : 'transparent',
                borderBottomWidth: borderBottom ? theme.spacing.borderWidth : 0,
                paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                paddingBottom: theme.spacing.xs,
                height: heightVariant === 'short' ? theme.spacing.headerHeightSmall : theme.spacing.headerHeight,
                backgroundColor: backgroundColor || theme.colors.background,
            },
        ]}>
            {/* Левая часть */}
            <View style={[styles.sideContainer,
            !hasLeftButtons && { display: 'none' }
            ]}>
                {allLeftButtons.map((button, index) => renderButton(button, index, true))}
            </View>

            {/* Центральная часть */}
            <View style={[
                styles.centerContainer,
                {
                    alignItems: titleAlignment,
                    marginLeft: !hasLeftButtons && titleAlignment === 'flex-start' ? theme.spacing.xs : 0,
                }]
            }>
                {title ? (
                    <Text style={[
                        styles.title,
                        { color: theme.colors.text, },
                        showBackButton ? { ...theme.typography.bodyLargeBold } : { ...theme.typography.h3 },
                    ]}>
                        {title}
                    </Text>
                ) : null}
            </View>

            {/* Правая часть */}
            <View style={styles.sideContainer}>
                {rightButtons.map((button, index) => renderButton(button, index, false))}
            </View>
        </View>
    );
};

export const HeaderButtons = {
    back: (onPress?: () => void): HeaderButton => ({
        icon: <ChevronLeft size={24} />,
        onPress: onPress || (() => router.back()),
        variant: 'simple',
    }),
    filter: (onPress?: () => void): HeaderButton => ({
        icon: <Filter size={20} />,
        onPress: onPress || (() => router.push('/filters')),
        variant: 'surface',
    }),
    notification: (onPress?: () => void): HeaderButton => ({
        icon: <Bell size={20} />,
        onPress: onPress || (() => router.push('/notifications')),
        variant: 'surface',
    }),
    menu: (onPress?: () => void): HeaderButton => ({
        icon: <Menu size={20} />,
        onPress: onPress || (() => { }),
        variant: 'surface',
    }),
    close: (onPress?: () => void): HeaderButton => ({
        icon: <X size={20} />,
        onPress: onPress || (() => router.back()),
        variant: 'surface',
    }),
    add: (onPress?: () => void): HeaderButton => ({
        icon: <Plus size={20} />,
        onPress: onPress || (() => router.push('/create-activity')),
        variant: 'primary',
    }),
    search: (onPress?: () => void): HeaderButton => ({
        icon: <SearchIcon size={20} />,
        onPress: onPress || (() => router.push('/')),
        variant: 'surface',
    }),
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sideContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 40,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
