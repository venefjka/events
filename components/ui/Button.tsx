import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.spacing.radius,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    };

    // Размеры
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = theme.spacing.buttonPaddingSmall;
        baseStyle.paddingHorizontal = theme.spacing.md;
        break;
      case 'large':
        baseStyle.paddingVertical = theme.spacing.buttonPaddingLarge;
        baseStyle.paddingHorizontal = theme.spacing.xl;
        break;
      default:
        baseStyle.paddingVertical = theme.spacing.buttonPadding;
        baseStyle.paddingHorizontal = theme.spacing.lg;
    }

    // Варианты
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = isDisabled ? theme.colors.disabled : theme.colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = isDisabled ? theme.colors.disabled : theme.colors.surface;
        baseStyle.borderWidth = theme.spacing.borderWidth;
        baseStyle.borderColor = theme.colors.border;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = theme.spacing.borderWidthThick;
        baseStyle.borderColor = isDisabled ? theme.colors.disabled : theme.colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.button,
    };

    // Размеры текста
    switch (size) {
      case 'small':
        baseStyle.fontSize = theme.typography.buttonSmall.fontSize;
        break;
      case 'large':
        baseStyle.fontSize = theme.typography.buttonLarge.fontSize;
        break;
    }

    // Цвета текста
    switch (variant) {
      case 'primary':
        baseStyle.color = theme.colors.textInverse;
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
        baseStyle.color = isDisabled ? theme.colors.disabled : theme.colors.text;
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? theme.colors.textInverse : theme.colors.primary} 
        />
      ) : (
        <>
          {icon && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
