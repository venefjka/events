import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';

export interface HeroChip {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
}

interface ActivityDetailHeroProps {
  title: string;
  photoUri?: string;
  relativeTime: string;
  isCancelled: boolean;
  heroChips: HeroChip[];
  onPress?: () => void;
}

export function ActivityDetailHero({
  title,
  photoUri,
  relativeTime,
  isCancelled,
  heroChips,
  onPress,
}: ActivityDetailHeroProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const hasPhoto = Boolean(photoUri);
  const gradientColors = [theme.colors.overlayLight, theme.colors.background] as const;

  const heroContent = (
    <LinearGradient
      colors={gradientColors}
      style={hasPhoto ? styles.heroOverlay : [styles.heroOverlay, { justifyContent: 'flex-end' }]}
    >
      <View style={styles.heroTopRow}>
        <Chip label={isCancelled ? 'Отменена' : relativeTime} variant="surface" size="xs" selected />
      </View>

      <View style={styles.heroBottom}>
        <Text style={[styles.heroTitle, { color: '#fff', ...theme.typography.h2 }]}>
          {title}
        </Text>
        <View style={styles.chipsWrap}>
          {heroChips.map((chip, index) => (
            <Chip
              key={`${chip.label}-${index}`}
              label={chip.label}
              icon={chip.icon}
              selected={chip.selected}
              variant="bw"
              size="xs"
              textStyle={{ color: chip.selected ? theme.colors.textInverse : '#fff' }}
              style={{
                backgroundColor: chip.selected ? theme.colors.primary : 'rgba(255,255,255,0.12)',
                borderColor: chip.selected ? theme.colors.primary : 'rgba(255,255,255,0.24)',
              }}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  if (!photoUri) {
    return (
      <View>
        <LinearGradient colors={gradientColors} style={styles.heroFallback}>
          {heroContent}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity activeOpacity={0.96} disabled={!onPress} onPress={onPress}>
        <ImageBackground source={{ uri: photoUri }} resizeMode="cover" style={styles.heroImage}>
          {heroContent}
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    heroImage: {
      minHeight: 330,
      width: '100%',
    },
    heroFallback: {
      minHeight: 160,
      width: '100%',
    },
    heroOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xxxl,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    heroBottom: {
      gap: theme.spacing.md,
    },
    heroTitle: {
      maxWidth: '92%',
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
