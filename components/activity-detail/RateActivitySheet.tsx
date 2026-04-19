import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';
import type { Activity } from '@/types';

interface RateActivitySheetProps {
  visible: boolean;
  activity: Activity;
  onClose: () => void;
}

export function RateActivitySheet({ visible, activity, onClose }: RateActivitySheetProps) {
  const { rateActivity } = useActivityRatings();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Внимание', 'Пожалуйста, поставьте оценку');
      return;
    }

    setIsSubmitting(true);

    try {
      await rateActivity(activity.id, rating, comment.trim() || undefined);
      Alert.alert('Спасибо!', 'Ваш отзыв поможет другим пользователям', [
        { text: 'OK', onPress: onClose },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Оценить организатора"
      onClose={onClose}
      minHeightRatio={0.7}
      footer={
        <View style={styles.footer}>
          <Button
            title="Отправить отзыв"
            variant="primary"
            size="medium"
            fullWidth
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.ratingSection}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => setRating(star)}
              >
                <Star
                  size={36}
                  color={theme.colors.text}
                  fill={star <= rating ? theme.colors.text : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Комментарий</Text>
          <FormField
            label=""
            value={comment}
            onChangeText={setComment}
            placeholder="Поделитесь впечатлениями..."
            multiline
            numberOfLines={5}
            backgroundColor={{ backgroundColor: theme.colors.surfaceVariant }}
            style={styles.commentField}
            inputStyle={styles.commentInput}
          />
        </View>

        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
          Ваш отзыв поможет другим пользователям оценить надежность организатора.
        </Text>
      </View>
    </BottomSheetModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.xl,
    },
    ratingSection: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.h3,
    },
    sectionSubtitle: {
      ...theme.typography.body,
      lineHeight: 20,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    starButton: {
      flex: 1,
      minHeight: theme.spacing.iconSizeXXLarge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingText: {
      ...theme.typography.bodyBold,
      textAlign: 'center',
    },
    commentSection: {
      gap: theme.spacing.md,
    },
    commentField: {
      marginBottom: 0,
    },
    commentInput: {
      ...theme.typography.body,
      textAlignVertical: 'top',
    },
    footer: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingTop: theme.spacing.lg,
    },
  });
