import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface ChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    variant?: 'default' | 'bw' | 'surface';
    size?: 'xs' | 'small' | 'medium';
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
    label,
    selected = false,
    onPress,
    variant = 'default',
    size = 'medium',
    icon,
    style,
    textStyle,
}) => {
    const theme = useTheme();
    const hasLabel = label.trim().length > 0;

    const getChipStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            borderRadius: theme.spacing.radiusRound,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: hasLabel && icon ? theme.spacing.xs : 0,
        };
        let textLineHeight = theme.typography.caption.lineHeight;

        switch (size) {
            case 'xs':
                baseStyle.borderWidth = theme.spacing.borderWidth / 2;
                baseStyle.paddingVertical = theme.spacing.xs;
                baseStyle.paddingHorizontal = theme.spacing.sm;
                textLineHeight = theme.typography.captionSmall.lineHeight;
                break;
            case 'small':
                baseStyle.borderWidth = theme.spacing.borderWidth;
                baseStyle.paddingVertical = theme.spacing.xs;
                baseStyle.paddingHorizontal = theme.spacing.md;
                break;
            case 'medium':
                baseStyle.borderWidth = theme.spacing.borderWidth;
                baseStyle.paddingVertical = theme.spacing.sm;
                baseStyle.paddingHorizontal = theme.spacing.lg;
                break;
        }

        // Фиксируем высоту, чтобы иконка без текста не "проседала".
        baseStyle.minHeight = (baseStyle.paddingVertical as number) * 2 + textLineHeight + 2;

        baseStyle.borderColor = selected ? theme.colors.primary : theme.colors.border;

        switch (variant) {
            case 'bw':
                baseStyle.backgroundColor = selected ? theme.colors.primary : theme.colors.background;
                baseStyle.borderWidth = theme.spacing.borderWidth;
                break;
            case 'surface':
                baseStyle.backgroundColor = selected ? theme.colors.primary : theme.colors.surface;
                break;
            case 'default':
                baseStyle.backgroundColor = selected ? theme.colors.primary : theme.colors.surfaceVariant;
                break;
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle =
            size === "xs" ? { ...theme.typography.captionSmall, fontWeight: '600' } : {
                ...theme.typography.caption,
                fontWeight: size === 'small' ? '500' : '600',
            };
        baseStyle.color = selected ? theme.colors.textInverse : theme.colors.text;

        return baseStyle;
    };

    const content = (
        <View style={[getChipStyle(), style]}>
            {icon && icon}
            {hasLabel && <Text style={[getTextStyle(), textStyle]}>{label}</Text>}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};
