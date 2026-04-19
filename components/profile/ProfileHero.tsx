import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { HeroBanner } from '@/components/hero/HeroBanner';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';

interface ProfileHeroProps {
  name: string;
  avatarUri?: string;
  subtitle?: string;
  ratingValue: number;
  attendanceRate: number;
  onPress?: () => void;
}

export function ProfileHero({
  name,
  avatarUri,
  subtitle,
  ratingValue,
  attendanceRate,
  onPress,
}: ProfileHeroProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <HeroBanner
      photoUri={avatarUri}
      onPress={onPress}
      minHeight={280}
      fallbackMinHeight={180}
      bottomContent={
        <View style={styles.bottom}>
          <Text style={[styles.title, { color: '#fff', ...theme.typography.h2 }]}>
            {name}
          </Text>

          {subtitle ? (
            <View style={styles.subtitleRow}>
              <MapPin size={theme.spacing.iconSizeXSmall} color="rgba(255,255,255,0.76)" />
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.76)', ...theme.typography.body }]}>
                {subtitle}
              </Text>
            </View>
          ) : null}

          <View style={styles.chipsWrap}>
            <Chip
              label={ratingValue.toFixed(1)}
              variant="bw"
              size="xs"
              style={styles.heroChip}
              textStyle={{ color: '#fff' }}
              icon={<Star size={theme.spacing.iconSizeXSmall} color="#fff" fill="#fff" />}
            />
            <Chip
              label={`${attendanceRate}% посещений`}
              variant="bw"
              size="xs"
              style={styles.heroChip}
              textStyle={{ color: '#fff' }}
            />
          </View>
        </View>
      }
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bottom: {
      gap: theme.spacing.sm,
    },
    title: {
      maxWidth: '92%',
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      maxWidth: '92%',
    },
    subtitle: {
      flexShrink: 1,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    heroChip: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderColor: 'rgba(255,255,255,0.24)',
    },
  });
