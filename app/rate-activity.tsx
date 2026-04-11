import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';

// todo: сделать с нуля

export default function RateActivityScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { rateActivity, hasUserRated } = useActivityRatings();
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const activity = allActivities.find((a) => a.id === activityId);

  if (!activity || !currentUser) {
    router.back();
    return null;
  }

  const hasAttended = activity.attendedUsers.includes(currentUser.id);
  const hasRated = hasUserRated(activity.id, currentUser.id);

  if (!hasAttended) {
    Alert.alert(
      'Ошибка',
      'Вы можете оценить только те мероприятия, которые вы посетили',
      [{ text: 'OK', onPress: () => router.back() }]
    );
    return null;
  }

  if (hasRated) {
    Alert.alert(
      'Уже оценено',
      'Вы уже оставили отзыв об этом мероприятии',
      [{ text: 'OK', onPress: () => router.back() }]
    );
    return null;
  }

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Внимание', 'Пожалуйста, поставьте оценку');
      return;
    }

    rateActivity(activity.id, rating, comment.trim() || undefined);
    Alert.alert(
      'Спасибо!',
      'Ваш отзыв поможет другим участникам',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Оценить мероприятие</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            {renderCategoryIcon(activity.category, theme.spacing.iconSizeLarge * 2)}
          </View>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityTime}>
            {new Date(activity.startAt).toLocaleString('ru', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.organizerCard}>
          <Avatar
            name={activity.organizer.name}
            size="small"
            imageUrl={activity.organizer.avatar}
            style={styles.organizerAvatar}
          />
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerLabel}>Организатор</Text>
            <Text style={styles.organizerName}>{activity.organizer.name}</Text>
            <View style={styles.organizerRating}>
              <Star size={12} color="#000" fill="#000" />
              <Text style={styles.organizerRatingText}>
                {activity.organizer.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Ваша оценка</Text>
          <Text style={styles.sectionSubtitle}>
            Как прошло мероприятие? Оцените организацию и атмосферу
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => setRating(star)}
              >
                <Star
                  size={48}
                  color="#000"
                  fill={star <= rating ? '#000' : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Очень плохо'}
              {rating === 2 && 'Плохо'}
              {rating === 3 && 'Нормально'}
              {rating === 4 && 'Хорошо'}
              {rating === 5 && 'Отлично!'}
            </Text>
          )}
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Комментарий (опционально)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Поделитесь своими впечатлениями..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Ваша оценка повлияет на рейтинг организатора и поможет другим
            пользователям в выборе мероприятий
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Отправить отзыв</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  activityCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  activityIcon: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  organizerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  organizerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerRatingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  ratingSection: {
    padding: 20,
    borderTopWidth: 8,
    borderTopColor: '#f5f5f5',
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  commentSection: {
    padding: 20,
  },
  commentInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    minHeight: 120,
  },
  infoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

