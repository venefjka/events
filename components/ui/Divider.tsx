import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface DividerProps {
  variant?: 'horizontal' | 'vertical';
  thickness?: number;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'horizontal',
  thickness,
  spacing = 'medium',
  style,
}) => {
  const theme = useTheme();

  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing.sm;
      case 'large':
        return theme.spacing.xl;
      default:
        return theme.spacing.md;
    }
  };

  const dividerStyle: ViewStyle = {
    backgroundColor: theme.colors.divider,
    ...(variant === 'horizontal'
      ? {
          height: thickness || theme.spacing.borderWidth,
          width: '100%',
          marginVertical: getSpacing(),
        }
      : {
          width: thickness || theme.spacing.borderWidth,
          height: '100%',
          marginHorizontal: getSpacing(),
        }),
  };

  return <View style={[dividerStyle, style]} />;
};
