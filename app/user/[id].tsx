import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, UserPlus, UserMinus, Edit } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { Avatar } from '@/components/ui/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPublic, UserRecord } from '@/types';
import { buildUserPublic, getUserAge } from '@/utils/user';
import { subcategoryById } from '@/constants/categories';

// todo: перерисовать + refactor

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { getAttendanceHistory } = useActivityParticipation();
  const { getUserRating } = useActivityRatings();
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const [freshUserData, setFreshUserData] = useState<UserRecord | null>(null);

  let user = allActivities
    .flatMap((a) => [a.organizer, ...a.currentParticipants])
    .find((u) => u.id === id);

  if (!user && currentUser?.id === id) {
    user = currentUser;
  }

  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (!id) return;
      try {
        const usersJson = await AsyncStorage.getItem('localUsers');
        if (usersJson) {
          const users: UserRecord[] = JSON.parse(usersJson);
          const freshUser = users.find((acc) => acc.id === id);
          if (freshUser) {
            setFreshUserData(freshUser);
          }
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
      }
    };

    fetchFreshUserData();
  }, [id, allActivities]);

  const isUserRecord = (value: UserRecord | UserPublic | null | undefined): value is UserRecord =>
    Boolean(value && 'email' in value && 'birthDate' in value);

  const baseUser = (freshUserData ?? (currentUser?.id === id ? currentUser : null) ?? user) as
    | UserRecord
    | UserPublic
    | null;

  if (!baseUser || !currentUser) {
    router.back();
    return null;
  }

  const isOwnProfile = baseUser.id === currentUser.id;
  const displayUser: UserRecord | UserPublic = isOwnProfile
    ? (isUserRecord(baseUser) ? baseUser : currentUser)
    : isUserRecord(baseUser)
      ? buildUserPublic(baseUser, currentUser.id, baseUser.attendanceHistory)
      : baseUser;

  const reviews = displayUser.reviews ?? [];
  const subscribed = isSubscribed(displayUser.id);
  const userAge = isOwnProfile ? getUserAge(currentUser.birthDate) : displayUser.age;
  const attendanceHistory = isOwnProfile
    ? currentUser.attendanceHistory ?? getAttendanceHistory(displayUser.id)
    : displayUser.attendanceHistory;
  const ratingValue =
    typeof displayUser.rating === 'number' ? displayUser.rating : getUserRating(displayUser.id);

  const interestLabels = Array.isArray(displayUser.interests)
    ? displayUser.interests.map(
      (interestId) => subcategoryById.get(interestId)?.name ?? interestId
    )
    : [];

  const canViewParticipationHistory =
    isOwnProfile || (isUserRecord(baseUser) && baseUser.privacy?.showAttendanceHistory);

  const handleOpenHistory = () => {
    router.push(`/user/${displayUser.id}/history`);
  };

  const attendanceRate = attendanceHistory && (attendanceHistory.attended + attendanceHistory.missed) > 0
    ? Math.round((attendanceHistory.attended / (attendanceHistory.attended + attendanceHistory.missed)) * 100)
    : 100;

  const handleSubscribe = () => {
    if (subscribed) {
      unsubscribe(displayUser.id);
    } else {
      subscribe(displayUser.id);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Avatar name={displayUser.name} size="large" imageUrl={displayUser.avatar} />
          <Text style={styles.name}>{displayUser.name}</Text>
          {typeof userAge === 'number' && (
            <Text style={styles.age}>{userAge} лет</Text>
          )}

          <View style={styles.rating}>
            <Star size={16} color="#000" fill="#000" />
            <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
          </View>

          {isOwnProfile && (
            <TouchableOpacity style={styles.editButton}>
              <Edit size={18} color="#fff" />
              <Text style={styles.editButtonText}>Редактировать профиль</Text>
            </TouchableOpacity>
          )}

          {!isOwnProfile && (
            <TouchableOpacity 
              style={[styles.subscribeButton, subscribed && styles.subscribedButton]}
              onPress={handleSubscribe}
            >
              {subscribed ? (
                <>
                  <UserMinus size={18} color="#000" />
                  <Text style={styles.subscribeButtonTextActive}>Отписаться</Text>
                </>
              ) : (
                <>
                  <UserPlus size={18} color="#fff" />
                  <Text style={styles.subscribeButtonText}>Подписаться</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        {attendanceHistory && (
          <View style={styles.attendanceCard}>
          <Text style={styles.sectionTitle}>Статистика посещений</Text>
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceValue}>{attendanceHistory.attended}</Text>
              <Text style={styles.attendanceLabel}>Посетил</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceValue, styles.attendanceMissed]}>
                {attendanceHistory.missed}
              </Text>
              <Text style={styles.attendanceLabel}>Пропустил</Text>
            </View>
          </View>
          <View style={styles.attendanceBar}>
            <View
              style={[
                styles.attendanceBarFill,
                { width: `${attendanceRate}%` },
              ]}
            />
          </View>
          <Text style={styles.attendancePercent}>
            {attendanceRate}% посещаемость
          </Text>
        </View>
        )}
        {interestLabels.length > 0 && (
          <View style={styles.interests}>
          <Text style={styles.sectionTitle}>Интересы</Text>
          <View style={styles.interestsList}>
            {interestLabels.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
        )}


        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Активность</Text>
          {canViewParticipationHistory ? (
            <TouchableOpacity style={styles.historyButton} onPress={handleOpenHistory}>
              <Text style={styles.historyButtonText}>Открыть историю</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.historyLockedText}>История посещений скрыта настройками конфиденциальности</Text>
          )}
        </View>


        {reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Отзывы</Text>
            {reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.fromUserName}</Text>
                    <View style={styles.reviewRating}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color="#000"
                          fill={i < review.rating ? '#000' : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString('ru')}
                  </Text>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },

  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  subscribedButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  subscribeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  subscribeButtonTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  attendanceCard: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  attendanceStat: {
    alignItems: 'center',
  },
  attendanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  attendanceMissed: {
    color: '#999',
  },
  attendanceCancelled: {
    color: '#999',
  },
  attendanceLabel: {
    fontSize: 13,
    color: '#666',
  },
  attendanceBar: {
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  attendanceBarFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 4,
  },
  attendancePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  interests: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  historySection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  historyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  historyLockedText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  reviewsSection: {
    padding: 20,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: '#999',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

