import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const theme = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing.md;
      case 'large':
        return theme.spacing.cardPaddingLarge;
      default:
        return theme.spacing.cardPadding;
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.spacing.radius,
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        baseStyle.backgroundColor = theme.colors.surface;
        baseStyle.shadowColor = theme.colors.text;
        baseStyle.shadowOffset = { width: 0, height: 2 };
        baseStyle.shadowOpacity = 0.1;
        baseStyle.shadowRadius = 4;
        baseStyle.elevation = 3;
        break;
      case 'outlined':
        baseStyle.backgroundColor = theme.colors.surface;
        baseStyle.borderWidth = theme.spacing.borderWidth;
        baseStyle.borderColor = theme.colors.border;
        break;
      default:
        baseStyle.backgroundColor = theme.colors.surface;
    }

    return baseStyle;
  };

  const content = <View style={[getCardStyle(), style]}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
