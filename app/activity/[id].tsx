import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, Users, Star, MessageCircle, Share2, Bookmark, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { allActivities, savedActivities, toggleSaveActivity, requestJoinActivity, leaveActivity, cancelJoinRequest } = useActivities();
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const activity = allActivities.find((a) => a.id === id);

  if (!activity || !currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Активность не найдена</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOrganizer = activity.organizer.id === currentUser.id;
  const isParticipant = activity.currentParticipants.some(p => p.id === currentUser.id);
  const isPending = activity.pendingRequests.some(p => p.id === currentUser.id);
  const isSaved = savedActivities.includes(activity.id);
  const isFull = activity.currentParticipants.length >= activity.maxParticipants;
  const spotsLeft = activity.maxParticipants - activity.currentParticipants.length;
  const isPastEvent = new Date(activity.startTime) < new Date();

  const handleJoin = () => {
    if (!isParticipant && !isPending && !isFull) {
      requestJoinActivity(activity.id);
    }
  };

  const handleCancelRequest = () => {
    if (isPending) {
      Alert.alert(
        'Отменить заявку',
        'Вы уверены, что хотите отменить заявку на участие?',
        [
          { text: 'Нет', style: 'cancel' },
          { text: 'Да', onPress: () => cancelJoinRequest(activity.id) },
        ]
      );
    }
  };

  const handleLeave = () => {
    if (isParticipant) {
      const eventTime = new Date(activity.startTime);
      const now = new Date();
      const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilEvent < 2 && hoursUntilEvent > 0) {
        Alert.alert(
          'Предупреждение',
          'До начала мероприятия осталось менее 2 часов. Отмена участия может повлиять на ваш рейтинг. Вы уверены?',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Да, отменить', style: 'destructive', onPress: () => leaveActivity(activity.id) },
          ]
        );
      } else {
        Alert.alert(
          'Отменить участие',
          'Вы уверены, что хотите отменить участие в этой активности?',
          [
            { text: 'Нет', style: 'cancel' },
            { text: 'Да', onPress: () => leaveActivity(activity.id) },
          ]
        );
      }
    }
  };

  const handleShare = () => {
    console.log('Share activity:', activity.id);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.categoryBanner}>
          <Text style={styles.categoryIcon}>{activity.category.icon}</Text>
          <Text style={styles.categoryName}>{activity.category.name}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{activity.title}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => toggleSaveActivity(activity.id)}
              >
                <Bookmark
                  size={22}
                  color="#000"
                  fill={isSaved ? '#000' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Share2 size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.organizerCard}>
            <View style={styles.organizerInfo}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerAvatarText}>
                  {activity.organizer.name[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.organizerName}>{activity.organizer.name}</Text>
                <View style={styles.organizerRating}>
                  <Star size={14} color="#000" fill="#000" />
                  <Text style={styles.ratingText}>
                    {activity.organizer.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.messageButton}>
              <MessageCircle size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Calendar size={20} color="#000" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {new Date(activity.startTime).toLocaleString('ru', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MapPin size={20} color="#000" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>{activity.location.address}</Text>
                {activity.location.name && (
                  <Text style={styles.detailSubtext}>{activity.location.name}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailItem}
              onPress={() => setShowParticipantsModal(true)}
            >
              <Users size={20} color="#000" style={styles.detailIcon} />
              <View style={styles.participantsContainer}>
                <View style={styles.participantAvatars}>
                  {activity.currentParticipants.slice(0, 3).map((participant, index) => (
                    <View
                      key={participant.id}
                      style={[styles.participantAvatar, { marginLeft: index * -8 }]}
                    >
                      <Text style={styles.participantAvatarText}>
                        {participant.name[0]}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.participantsText}>
                  {activity.currentParticipants.length}/{activity.maxParticipants} участников
                </Text>
                {spotsLeft > 0 && (
                  <Text style={styles.spotsLeft}>• {spotsLeft} мест свободно</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>

        {!activity.isFree && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Стоимость</Text>
              <Text style={styles.priceValue}>{activity.price} ₽</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Кого ищет организатор</Text>
          <View style={styles.preferencesList}>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Уровень:</Text>
              <Text style={styles.preferenceValue}>
                {activity.level === 'beginner' && 'Новичок'}
                {activity.level === 'intermediate' && 'Любитель'}
                {activity.level === 'advanced' && 'Профи'}
              </Text>
            </View>
            {activity.preferences.gender && activity.preferences.gender !== 'any' && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Пол:</Text>
                <Text style={styles.preferenceValue}>
                  {activity.preferences.gender === 'male' && 'Мужчины'}
                  {activity.preferences.gender === 'female' && 'Женщины'}
                  {activity.preferences.gender === 'mixed' && 'Смешанная группа'}
                </Text>
              </View>
            )}
            {activity.preferences.ageRange && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Возраст:</Text>
                <Text style={styles.preferenceValue}>{activity.preferences.ageRange}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {isOrganizer ? (
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Отменить</Text>
            </TouchableOpacity>
          </View>
        ) : isParticipant ? (
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.chatButton}>
              <MessageCircle size={20} color="#fff" />
              <Text style={styles.chatButtonText}>Перейти в чат</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
              <Text style={styles.leaveButtonText}>Отменить участие</Text>
            </TouchableOpacity>
          </View>
        ) : isPending ? (
          <TouchableOpacity
            style={styles.pendingButton}
            onPress={handleCancelRequest}
          >
            <Text style={styles.pendingButtonText}>Отменить заявку</Text>
          </TouchableOpacity>
        ) : isPastEvent ? (
          <TouchableOpacity
            style={styles.joinButtonDisabled}
            disabled
          >
            <Text style={styles.joinButtonText}>Событие завершено</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={isFull}
          >
            <Text style={styles.joinButtonText}>
              {isFull ? 'Мест нет' : activity.requiresApproval ? 'Подать заявку' : 'Я пойду!'}
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <Modal
        visible={showParticipantsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipantsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Участники ({activity.currentParticipants.length})</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowParticipantsModal(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.participantsList}>
              {activity.currentParticipants.map((participant) => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantItem}
                  onPress={() => {
                    setShowParticipantsModal(false);
                    if (participant.id !== currentUser.id) {
                      router.push(`/user/${participant.id}`);
                    }
                  }}
                >
                  <View style={styles.participantItemAvatar}>
                    <Text style={styles.participantItemAvatarText}>
                      {participant.name[0]}
                    </Text>
                  </View>
                  <View style={styles.participantItemInfo}>
                    <Text style={styles.participantItemName}>
                      {participant.name}
                      {participant.id === activity.organizer.id && ' (Организатор)'}
                      {participant.id === currentUser.id && ' (Вы)'}
                    </Text>
                    <View style={styles.participantItemRating}>
                      <Star size={12} color="#000" fill="#000" />
                      <Text style={styles.participantItemRatingText}>
                        {participant.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  categoryBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 20,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  organizerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  detailSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  participantsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  participantsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  spotsLeft: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  preferencesList: {
    gap: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 15,
    color: '#666',
    width: 100,
  },
  preferenceValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    padding: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chatButton: {
    flex: 2,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  leaveButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  pendingButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  pendingButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsList: {
    padding: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
  },
  participantItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantItemAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  participantItemInfo: {
    flex: 1,
  },
  participantItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  participantItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantItemRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
});
