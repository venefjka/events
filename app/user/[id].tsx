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
import { Star, ArrowLeft, MessageCircle, UserPlus, UserMinus, Edit } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { allActivities, getUserRating } = useActivities();
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'created'>('created');
  const [freshUserData, setFreshUserData] = useState<User | null>(null);

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
        const accountsJson = await AsyncStorage.getItem('accounts');
        if (accountsJson) {
          const accounts: User[] = JSON.parse(accountsJson);
          const freshUser = accounts.find((acc) => acc.id === id);
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

  const displayUser = freshUserData || user;

  if (!displayUser || !currentUser) {
    router.back();
    return null;
  }

  const isOwnProfile = displayUser.id === currentUser.id;
  const subscribed = isSubscribed(displayUser.id);

  const now = new Date();
  
  const userCreatedActivities = allActivities.filter((a) => a.organizer.id === displayUser.id);
  
  const userUpcomingActivities = allActivities.filter((activity) => {
    const isParticipant = activity.currentParticipants.some(p => p.id === displayUser.id);
    const isFuture = new Date(activity.startTime) > now;
    return isParticipant && isFuture;
  });
  
  const userPastActivities = allActivities.filter((activity) => {
    const wasParticipant = activity.currentParticipants.some(p => p.id === displayUser.id) || 
                          activity.attendedUsers.includes(displayUser.id);
    const isPast = new Date(activity.startTime) < now;
    return wasParticipant && isPast;
  });

  const attendanceRate = displayUser.attendanceHistory.attended > 0
    ? Math.round((displayUser.attendanceHistory.attended / (displayUser.attendanceHistory.attended + displayUser.attendanceHistory.missed)) * 100)
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayUser.name[0]}</Text>
          </View>
          <Text style={styles.name}>{displayUser.name}</Text>
          <Text style={styles.age}>{displayUser.age} лет</Text>

          <View style={styles.rating}>
            <Star size={16} color="#000" fill="#000" />
            <Text style={styles.ratingText}>{displayUser.rating.toFixed(1)}</Text>
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

        <View style={styles.attendanceCard}>
          <Text style={styles.sectionTitle}>Статистика посещений</Text>
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceValue}>{displayUser.attendanceHistory.attended}</Text>
              <Text style={styles.attendanceLabel}>Посетил</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceValue, styles.attendanceMissed]}>
                {displayUser.attendanceHistory.missed}
              </Text>
              <Text style={styles.attendanceLabel}>Пропустил</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceValue, styles.attendanceCancelled]}>
                {displayUser.attendanceHistory.cancelled}
              </Text>
              <Text style={styles.attendanceLabel}>Отменил</Text>
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

        <View style={styles.interests}>
          <Text style={styles.sectionTitle}>Интересы</Text>
          <View style={styles.interestsList}>
            {displayUser.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Активности</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'created' && styles.tabActive]}
              onPress={() => setActiveTab('created')}
            >
              <Text style={[styles.tabText, activeTab === 'created' && styles.tabTextActive]}>
                Создал
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                Предстоящие
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.tabActive]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                Прошедшие
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'created' && userCreatedActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Нет созданных активностей</Text>
            </View>
          )}

          {activeTab === 'created' &&
            userCreatedActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{activity.category.icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.startTime).toLocaleString('ru', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.activityLocation}>{activity.location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {activeTab === 'upcoming' && userUpcomingActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Нет предстоящих активностей</Text>
            </View>
          )}

          {activeTab === 'upcoming' &&
            userUpcomingActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{activity.category.icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.startTime).toLocaleString('ru', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.activityLocation}>{activity.location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {activeTab === 'past' && userPastActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Нет прошедших активностей</Text>
            </View>
          )}

          {activeTab === 'past' &&
            userPastActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{activity.category.icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.startTime).toLocaleString('ru', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.activityLocation}>{activity.location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>

        {displayUser.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Отзывы</Text>
            {displayUser.reviews.slice(0, 3).map((review) => (
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
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
  activitiesSection: {
    padding: 20,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
  },
  activityCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  activityIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 28,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 13,
    color: '#999',
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
