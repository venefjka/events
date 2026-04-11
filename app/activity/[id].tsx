import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, Users, MessageCircle, Share2, Bookmark, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import { formatActivityDate, formatTimeZoneOffset } from '@/utils/date';
import { getHoursUntilEvent } from '@/utils/date';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { allActivities, savedActivities, toggleSaveActivity } = useActivities();
  const { requestJoinActivity, leaveActivity, cancelJoinRequest } = useActivityParticipation();
  const theme = useTheme();
  const commonStyles = createCommonStyles(theme);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const activity = allActivities.find((a) => a.id === id);

  if (!activity || !currentUser) {
    return (
      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]}>
        <View style={commonStyles.emptyContainer}>
          <Text style={[commonStyles.emptyText, {
            ...theme.typography.body,
            color: theme.colors.textSecondary,
          }]}>Активность не найдена</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOrganizer = activity.organizer.id === currentUser.id;
  const isParticipant = activity.currentParticipants.some(p => p.id === currentUser.id);
  const isPending = activity.pendingRequests.some(p => p.id === currentUser.id);
  const isSaved = savedActivities.includes(activity.id);
  const maxParticipants = activity.preferences?.maxParticipants ?? 0;
  const isUnlimited = maxParticipants <= 0;
  const isFull = !isUnlimited && activity.currentParticipants.length >= maxParticipants;
  const spotsLeft = isUnlimited
    ? Infinity
    : maxParticipants - activity.currentParticipants.length;
  const isPastEvent = new Date(activity.startAt) < new Date();
  const ageFrom = activity.preferences?.ageFrom;
  const ageTo = activity.preferences?.ageTo;
  const ageText = ageFrom != null || ageTo != null
    ? ageFrom != null && ageTo != null
      ? `от ${ageFrom} до ${ageTo} лет`
      : ageFrom != null
        ? `от ${ageFrom} лет`
        : `до ${ageTo} лет`
    : null;

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
      const hoursUntilEvent = getHoursUntilEvent(activity.startAt);

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
    <View style={[commonStyles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={commonStyles.content}>
        <View style={[styles.categoryBanner, {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.spacing.borderWidth,
          paddingVertical: theme.spacing.xxl,
        }]}>
          <View style={{ marginBottom: theme.spacing.sm }}>
            {renderCategoryIcon(activity.category, theme.spacing.iconSizeXLarge * 2)}
          </View>
          <Text style={[styles.categoryName, {
            ...theme.typography.bodyBold,
            color: theme.colors.textSecondary,
          }]}>{activity.category.name}</Text>
        </View>

        <View style={[commonStyles.section, {
          padding: theme.spacing.screenPaddingHorizontal,
        }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, {
              ...theme.typography.h3,
              color: theme.colors.text,
              flex: 1,
              marginBottom: theme.spacing.lg,
            }]}>{activity.title}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.iconButton, {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.spacing.radiusRound,
                  width: 40,
                  height: 40,
                }]}
                onPress={() => toggleSaveActivity(activity.id)}
              >
                <Bookmark
                  size={theme.spacing.iconSize}
                  color={theme.colors.text}
                  fill={isSaved ? theme.colors.text : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, {
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: theme.spacing.radiusRound,
                width: 40,
                height: 40,
              }]} onPress={handleShare}>
                <Share2 size={theme.spacing.iconSize} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Card variant="outlined" padding="medium" style={{
            backgroundColor: theme.colors.surface,
            marginBottom: theme.spacing.xl,
          }}>
            <View style={styles.organizerInfo}>
              <Avatar name={activity.organizer.name} size="small" imageUrl={activity.organizer.avatar} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={[styles.organizerName, {
                  ...theme.typography.bodyBold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }]}>{activity.organizer.name}</Text>
                <Rating rating={activity.organizer.rating} size={14} variant="compact" />
              </View>
              <TouchableOpacity style={[styles.messageButton, {
                backgroundColor: theme.colors.background,
                borderRadius: theme.spacing.radiusRound,
                width: 40,
                height: 40,
              }]}>
                <MessageCircle size={theme.spacing.iconSize} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </Card>

          <View style={[styles.detailsList, { gap: theme.spacing.lg }]}>
            <View style={styles.detailItem}>
              <Calendar size={theme.spacing.iconSize} color={theme.colors.text} style={{ marginRight: theme.spacing.md }} />
              <Text style={[styles.detailText, {
                ...theme.typography.body,
                color: theme.colors.text,
                flex: 1,
              }]}>
                {formatActivityDate(activity.startAt, activity.timeZone)}
                {activity.endAt ? ` — ${formatActivityDate(activity.endAt, activity.timeZone)}` : ''}
                {activity.timeZone
                  ? ` (${formatTimeZoneOffset(activity.startAt, activity.timeZone)})`
                  : ''}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MapPin size={theme.spacing.iconSize} color={theme.colors.text} style={{ marginRight: theme.spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailText, {
                  ...theme.typography.body,
                  color: theme.colors.text,
                }]}>{activity.location.address}</Text>
                {activity.location.name && (
                  <Text style={[styles.detailSubtext, {
                    ...theme.typography.caption,
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.xs,
                  }]}>{activity.location.name}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailItem}
              onPress={() => setShowParticipantsModal(true)}
            >
              <Users size={theme.spacing.iconSize} color={theme.colors.text} style={{ marginRight: theme.spacing.md }} />
              <View style={styles.participantsContainer}>
                <View style={styles.participantAvatars}>
                  {activity.currentParticipants.slice(0, 3).map((participant, index) => (
                    <Avatar
                      key={participant.id}
                      name={participant.name}
                      size="small"
                      imageUrl={participant.avatar}
                      style={{ marginLeft: index * -8 }}
                    />
                  ))}
                </View>
                <Text style={[styles.participantsText, {
                  ...theme.typography.body,
                  color: theme.colors.text,
                }]}>
                  {activity.currentParticipants.length}/{isUnlimited ? '∞' : maxParticipants} участников
                </Text>
                {spotsLeft > 0 && (
                  <Text style={[styles.spotsLeft, {
                    ...theme.typography.caption,
                    color: theme.colors.textSecondary,
                  }]}>• {spotsLeft} мест свободно</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Divider spacing="none" thickness={theme.spacing.sectionDivider} />

        <View style={[commonStyles.section, {
          padding: theme.spacing.screenPaddingHorizontal,
        }]}>
          <Text style={[commonStyles.sectionTitle, {
            marginBottom: theme.spacing.md,
          }]}>Описание</Text>
          <Text style={[styles.description, {
            ...theme.typography.body,
            color: theme.colors.text,
            lineHeight: 24,
          }]}>{activity.description}</Text>
        </View>

        {activity.price !== 0 && (
          <>
            <Divider spacing="none" thickness={theme.spacing.sectionDivider} />
            <View style={[commonStyles.section, {
              padding: theme.spacing.screenPaddingHorizontal,
            }]}>
              <Text style={[commonStyles.sectionTitle, {
                marginBottom: theme.spacing.md,
              }]}>Стоимость</Text>
              <Text style={[styles.priceValue, {
                ...theme.typography.h3,
                color: theme.colors.text,
              }]}>{activity.price} ₽</Text>
            </View>
          </>
        )}

        <Divider spacing="none" thickness={theme.spacing.sectionDivider} />

        <View style={[commonStyles.section, {
          padding: theme.spacing.screenPaddingHorizontal,
        }]}>
          <Text style={[commonStyles.sectionTitle, {
            marginBottom: theme.spacing.md,
          }]}>Кого ищет организатор</Text>
          <View style={[styles.preferencesList, { gap: theme.spacing.sm }]}>
            {activity.preferences?.level && (
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceLabel, {
                  ...theme.typography.body,
                  color: theme.colors.textSecondary,
                  width: 100,
                }]}>Уровень:</Text>
                <Text style={[styles.preferenceValue, {
                  ...theme.typography.bodyBold,
                  color: theme.colors.text,
                }]}>
                  {activity.preferences?.level === 'beginner' && 'Новичок'}
                  {activity.preferences?.level === 'intermediate' && 'Любитель'}
                  {activity.preferences?.level === 'advanced' && 'Профи'}
                </Text>
              </View>
            )}
            {activity.preferences?.gender && (
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceLabel, {
                  ...theme.typography.body,
                  color: theme.colors.textSecondary,
                  width: 100,
                }]}>Пол:</Text>
                <Text style={[styles.preferenceValue, {
                  ...theme.typography.bodyBold,
                  color: theme.colors.text,
                }]}>
                  {activity.preferences?.gender === 'male' && 'Мужчины'}
                  {activity.preferences?.gender === 'female' && 'Женщины'}
                </Text>
              </View>
            )}
            {ageText && (
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceLabel, {
                  ...theme.typography.body,
                  color: theme.colors.textSecondary,
                  width: 100,
                }]}>Возраст:</Text>
                <Text style={[styles.preferenceValue, {
                  ...theme.typography.bodyBold,
                  color: theme.colors.text,
                }]}>{ageText}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.footer, {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border,
        borderTopWidth: theme.spacing.borderWidth,
        padding: theme.spacing.lg,
      }]}>
        {isOrganizer ? (
          <View style={[styles.footerButtons, { gap: theme.spacing.md }]}>
            <Button
              title="Редактировать"
              onPress={() => { }}
              variant="primary"
              size="medium"
              style={{ flex: 1 }}
            />
            <Button
              title="Отменить"
              onPress={() => { }}
              variant="secondary"
              size="medium"
              style={{ flex: 1 }}
            />
          </View>
        ) : isParticipant ? (
          <View style={[styles.footerButtons, { gap: theme.spacing.md }]}>
            <Button
              title="Перейти в чат"
              onPress={() => { }}
              variant="primary"
              size="medium"
              icon={<MessageCircle size={theme.spacing.iconSize} color={theme.colors.textInverse} />}
              style={{ flex: 2 }}
            />
            <Button
              title="Отменить участие"
              onPress={handleLeave}
              variant="secondary"
              size="medium"
              style={{ flex: 1 }}
            />
          </View>
        ) : isPending ? (
          <Button
            title="Отменить заявку"
            onPress={handleCancelRequest}
            variant="outline"
            size="large"
            fullWidth
          />
        ) : isPastEvent ? (
          <Button
            title="Событие завершено"
            onPress={() => { }}
            variant="secondary"
            size="large"
            disabled
            fullWidth
          />
        ) : (
          <Button
            title={isFull ? 'Мест нет' : activity.requiresApproval ? 'Подать заявку' : 'Я пойду!'}
            onPress={handleJoin}
            variant="primary"
            size="large"
            disabled={isFull}
            fullWidth
          />
        )}
      </SafeAreaView>

      <Modal
        visible={showParticipantsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipantsModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.spacing.radiusXLarge,
            borderTopRightRadius: theme.spacing.radiusXLarge,
            maxHeight: '80%',
          }]}>
            <View style={[styles.modalHeader, {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: theme.spacing.borderWidth,
              padding: theme.spacing.screenPaddingHorizontal,
            }]}>
              <Text style={[styles.modalTitle, {
                ...theme.typography.h4,
                color: theme.colors.text,
              }]}>Участники ({activity.currentParticipants.length})</Text>
              <TouchableOpacity
                style={[styles.modalCloseButton, {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.spacing.radiusRound,
                  width: 40,
                  height: 40,
                }]}
                onPress={() => setShowParticipantsModal(false)}
              >
                <X size={theme.spacing.iconSizeLarge} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={[styles.participantsList, {
              padding: theme.spacing.screenPaddingHorizontal,
            }]}>
              {activity.currentParticipants.map((participant) => (
                <Card
                  key={participant.id}
                  variant="outlined"
                  padding="medium"
                  onPress={() => {
                    setShowParticipantsModal(false);
                    if (participant.id !== currentUser.id) {
                      router.push(`/user/${participant.id}`);
                    }
                  }}
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  <View style={styles.participantItem}>
                    <Avatar name={participant.name} size="medium" imageUrl={participant.avatar} />
                    <View style={[styles.participantItemInfo, { marginLeft: theme.spacing.md, flex: 1 }]}>
                      <Text style={[styles.participantItemName, {
                        ...theme.typography.bodyBold,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs,
                      }]}>
                        {participant.name}
                        {participant.id === activity.organizer.id && ' (Организатор)'}
                        {participant.id === currentUser.id && ' (Вы)'}
                      </Text>
                      <Rating rating={participant.rating} size={12} variant="compact" />
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryBanner: {
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 16,
  },
  messageButton: {
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
  detailText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailSubtext: {
    fontSize: 14,
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
  participantsText: {
    fontSize: 15,
  },
  spotsLeft: {
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  priceValue: {
    fontSize: 24,
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
  },
  preferenceValue: {
    fontSize: 15,
  },
  footer: {
    backgroundColor: '#fff',
  },
  footerButtons: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
  },
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsList: {
    padding: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantItemInfo: {
    flex: 1,
  },
  participantItemName: {
    fontSize: 16,
  },
});



