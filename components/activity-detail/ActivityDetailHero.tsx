import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { HeroBanner } from '@/components/hero/HeroBanner';
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

  return (
    <HeroBanner
      photoUri={photoUri}
      onPress={onPress}
      minHeight={330}
      fallbackMinHeight={160}
      topContent={
        <Chip
          label={isCancelled ? 'Отменена' : relativeTime}
          variant="surface"
          size="xs"
          selected
        />
      }
      bottomContent={
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
      }
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
