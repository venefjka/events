import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rating } from '@/components/ui/Rating';
import type { Activity, Review } from '@/types';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';

type ReviewCardProps = {
  review: Review;
  activity: Activity | null;
};

export function ReviewCard({ review, activity }: ReviewCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reviewText = review.text.trim();
  const activityTitle = activity?.title ?? 'Активность';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text numberOfLines={2} style={{ color: theme.colors.text, ...theme.typography.bodyBold }}>
            {activityTitle}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>
            от {review.fromUserName}
          </Text>
        </View>
        <View style={styles.meta}>
          <Rating
            rating={review.rating}
            size={theme.spacing.iconSizeXSmall}
            variant="compact"
            showValue={false}
            style={{height: theme.typography.bodyBold.lineHeight}}
          />
          <Text style={[styles.date, { color: theme.colors.textTertiary, ...theme.typography.caption }]}>
            {new Date(review.date).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>
      {reviewText ? (
        <Text style={{ color: theme.colors.text, ...theme.typography.body }}>
          "{reviewText}"
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.spacing.radiusLarge,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    headerMain: {
      flex: 1,
      minWidth: 0,
      gap: theme.spacing.xs / 2,
    },
    meta: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      gap: theme.spacing.xs / 2,
      minWidth: 72,
    },
    date: {
      textAlign: 'right',
    },
  });
