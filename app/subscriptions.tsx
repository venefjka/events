import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Pin } from 'lucide-react-native';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { Activity, Subscription } from '../types';
import { Avatar } from '@/components/ui/Avatar';

// todo: перерисовать + refactor

export default function SubscriptionsScreen() {
  const { subscriptions, togglePin, isPinned } = useSubscriptions();
  const { allActivities } = useActivities();

  const allUsers = useMemo(() => {
    const usersMap = new Map();
    allActivities.forEach((activity: Activity) => {
      if (!usersMap.has(activity.organizer.id)) {
        usersMap.set(activity.organizer.id, activity.organizer);
      }
      activity.currentParticipants.forEach((participant) => {
        if (!usersMap.has(participant.id)) {
          usersMap.set(participant.id, participant);
        }
      });
    });
    return Array.from(usersMap.values());
  }, [allActivities]);

  const subscribedUsers = useMemo(() => {
    return subscriptions
      .map((sub) => {
        const user = allUsers.find((u) => u.id === sub.userId);
        return user ? { ...sub, user } : null;
      })
      .filter((item) => item !== null);
  }, [subscriptions, allUsers]);

  const sortedUsers = useMemo(() => {
    const pinned = subscribedUsers
      .filter((item) => item.isPinned)
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
    
    const unpinned = subscribedUsers
      .filter((item) => !item.isPinned)
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
    
    return [...pinned, ...unpinned];
  }, [subscribedUsers]);

  const pinnedCount = subscribedUsers.filter((item) => item.isPinned).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Мои подписки</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {sortedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateText}>Нет подписок</Text>
              <Text style={styles.emptyStateSubtext}>
                Подписывайтесь на пользователей, чтобы следить за их активностями
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.info}>
                <Text style={styles.infoText}>
                  {subscribedUsers.length} {subscribedUsers.length === 1 ? 'подписка' : 'подписок'}
                  {pinnedCount > 0 && ` • ${pinnedCount} закреплено`}
                </Text>
                <Text style={styles.infoSubtext}>
                  Можно закрепить до 5 подписок
                </Text>
              </View>

              {sortedUsers.map((item) => (
                <TouchableOpacity
                  key={item.user.id}
                  style={styles.userCard}
                  onPress={() => router.push(`/user/${item.user.id}`)}
                >
                  <View style={styles.userLeft}>
                    <Avatar name={item.user.name} size="small" imageUrl={item.user.avatar} />
                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        {item.isPinned && (
                          <Pin size={14} color="#000" fill="#000" />
                        )}
                      </View>
                      {typeof item.user.age === 'number' && (
                        <Text style={styles.userAge}>{item.user.age} ???</Text>
                      )}
                      <View style={styles.rating}>
                        <Star size={12} color="#000" fill="#000" />
                        <Text style={styles.ratingText}>{(item.user.rating ?? 0).toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.pinButton, item.isPinned && styles.pinButtonActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePin(item.user.id);
                    }}
                  >
                    <Pin
                      size={18}
                      color={item.isPinned ? '#fff' : '#666'}
                      fill={item.isPinned ? '#fff' : 'none'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
  backButton: {
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
  info: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  pinButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonActive: {
    backgroundColor: '#000',
  },
});
