import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';

interface HeroBannerProps {
  photoUri?: string;
  onPress?: () => void;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  minHeight?: number;
  fallbackMinHeight?: number;
  contentStyle?: ViewStyle;
  bottomAlignWithoutPhoto?: boolean;
}

export function HeroBanner({
  photoUri,
  onPress,
  topContent,
  bottomContent,
  minHeight = 330,
  fallbackMinHeight = 160,
  contentStyle,
  bottomAlignWithoutPhoto = true,
}: HeroBannerProps) {
  const theme = useTheme();
  const styles = createStyles(theme, minHeight, fallbackMinHeight);
  const hasPhoto = Boolean(photoUri);
  const gradient = ['transparent', theme.colors.overlayLight, theme.colors.background] as const;
  const gradientOverlay = [theme.colors.overlayLight, theme.colors.background] as const;

  const content = (
    <LinearGradient
      colors={hasPhoto ? gradient : gradientOverlay}
      style={hasPhoto ?
        [styles.overlay, contentStyle,]
        : bottomAlignWithoutPhoto ?
          [styles.overlayBottomAligned, styles.fallback]
          : styles.fallback}
    >
      {topContent ? <View style={styles.topRow}>{topContent}</View> : <View />}
      {bottomContent ? <View style={styles.bottom}>{bottomContent}</View> : null}
    </LinearGradient>
  );
  if (!hasPhoto) {
    return (
      <View>
        {content}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity activeOpacity={0.96} disabled={!onPress} onPress={onPress}>
        <ImageBackground source={{ uri: photoUri }} resizeMode="cover" style={styles.image}>
          {content}
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme, minHeight: number, fallbackMinHeight: number) =>
  StyleSheet.create({
    image: {
      minHeight,
      width: '100%',
    },
    fallback: {
      minHeight: fallbackMinHeight,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xxxl,
    },
    overlay: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xxxl,
    },
    overlayBottomAligned: {
      justifyContent: 'flex-end',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    bottom: {
      gap: theme.spacing.md,
    },
  });
