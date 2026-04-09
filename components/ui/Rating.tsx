import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../themes/useTheme';

export interface RatingProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  size?: number;
  showCount?: number;
  countLabel?: string;
  variant?: 'default' | 'compact';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  showValue = true,
  size = 16,
  showCount,
  countLabel,
  variant = 'default',
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const displayRating = Math.min(Math.max(rating, 0), maxRating);
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <View style={[styles.container, { gap: variant === 'compact' ? theme.spacing.xs : theme.spacing.sm }, style]}>
      <View style={styles.stars}>
        {Array.from({ length: maxRating }).map((_, index) => {
          const isFilled = index < fullStars || (index === fullStars && hasHalfStar);
          return (
            <Star
              key={index}
              size={size}
              color={theme.colors.primary}
              fill={isFilled ? theme.colors.primary : 'none'}
            />
          );
        })}
      </View>
      {showValue && (
        <Text
          style={[
            styles.ratingText,
            {
              ...theme.typography.bodyBold,
              color: theme.colors.text,
            },
            textStyle,
          ]}
        >
          {displayRating.toFixed(1)}
        </Text>
      )}
      {showCount !== undefined && (
        <Text
          style={[
            styles.countText,
            {
              ...theme.typography.caption,
              color: theme.colors.textSecondary,
            },
            textStyle,
          ]}
        >
          {countLabel ? `${showCount} ${countLabel}` : `(${showCount})`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
  },
  countText: {
    marginLeft: 4,
  },
});
