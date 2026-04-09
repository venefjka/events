import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    style?: ViewStyle;
    paddingVertical?: number;
    paddingHorizontal?: number;
    iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    style,
    paddingVertical = 60,
    paddingHorizontal = 40,
    iconSize = 96,
}) => {
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);


    return (
        <View style={[
            commonStyles.emptyContainer,
            styles.container,
            { paddingVertical, paddingHorizontal },
            style,
        ]}>
            {icon && (
                <View style={[styles.iconContainer, { marginBottom: theme.spacing.lg }]}>
                    {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement<any>, {
                            size: iconSize,
                            color: theme.colors.border,
                        })
                        : icon
                    }
                </View>
            )}

            {title && (
                <Text style={[
                    commonStyles.emptyText,
                    styles.title,
                    {
                        ...theme.typography.bodyLargeBold,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.sm,
                    },
                ]}>
                    {title}
                </Text>
            )}

            {description && (
                <Text style={[
                    commonStyles.emptyText,
                    styles.description,
                    {
                        ...theme.typography.caption,
                        color: theme.colors.textSecondary,
                    },
                ]}>
                    {description}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
    },
});