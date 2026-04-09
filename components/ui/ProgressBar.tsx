import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';

interface ProgressBarProps {
  progress: number;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 4 }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      height, 
      backgroundColor: theme.colors.border,
      borderRadius: height / 2,
    }]}>
      <View style={[styles.progress, { 
        width: `${progress * 100}%`,
        backgroundColor: theme.colors.primary,
        borderRadius: height / 2,
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});