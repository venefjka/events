import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pin, UserMinus, Users } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { useSubscriptions } from '@/hooks/queries/useSubscriptions';
import { useToggleSubscriptionPin } from '@/hooks/mutations/useToggleSubscriptionPin';
import { useUnsubscribe } from '@/hooks/mutations/useUnsubscribe';
import { createCommonStyles } from '@/styles/common';
import { useTheme } from '@/themes/useTheme';
import type { SubscriptionDto } from '@/types/dto';
import { getFileUrl } from '@/utils/files';

const getSubscriptionLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'подписок';
  }

  if (lastDigit === 1) {
    return 'подписка';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'подписки';
  }

  return 'подписок';
};

export default function SubscriptionsScreen() {
  const subscriptionsQuery = useSubscriptions();
  const togglePinMutation = useToggleSubscriptionPin();
  const unsubscribeMutation = useUnsubscribe();
  const theme = useTheme();
  const commonStyles = createCommonStyles(theme);

  const sortedUsers = useMemo<SubscriptionDto[]>(() => {
    return [...(subscriptionsQuery.data?.items ?? [])]
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }

        return left.user.name.localeCompare(right.user.name, 'ru');
      });
  }, [subscriptionsQuery.data?.items]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Header title="Подписки" showBackButton borderBottom={false} />

        {subscriptionsQuery.isLoading ? (
          <View style={commonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.container}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.border,
                  paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                  paddingBottom: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={{
                  ...theme.typography.bodyBold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {sortedUsers.length} {getSubscriptionLabel(sortedUsers.length)}
              </Text>
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.textSecondary,
                }}
              >
                Можно закрепить до 5 человек
              </Text>
            </View>

            <ScrollView
              style={[commonStyles.content, { backgroundColor: theme.colors.surface }]}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {sortedUsers.length === 0 ? (
                <EmptyState
                  icon={<Users size={theme.spacing.iconSizeXXLarge} />}
                  title="Нет подписок"
                  description="Подписывайтесь на пользователей, чтобы следить за их активностью"
                />
              ) : (
                <View
                  style={{
                    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                    paddingBottom: theme.spacing.xl,
                  }}
                >
                  {sortedUsers.map((item, index) => (
                    <View
                      key={item.user.id}
                      style={[
                        styles.userRow,
                        {
                          borderBottomColor: theme.colors.borderLight,
                          borderBottomWidth: index === sortedUsers.length - 1 ? 0 : theme.spacing.borderWidth,
                          paddingVertical: theme.spacing.lg,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.userMain, item.user.isDeleted && styles.deletedUser]}
                        activeOpacity={0.85}
                        disabled={item.user.isDeleted}
                        onPress={() => router.push(`/user/${item.user.id}`)}
                      >
                        <Avatar
                          name={item.user.name}
                          size="medium"
                          imageUrl={getFileUrl(item.user.avatarFileId)}
                          isDeleted={item.user.isDeleted}
                        />

                        <View style={[styles.userInfo, { marginLeft: theme.spacing.md }]}>
                          <View style={styles.nameRow}>
                            <Text
                              style={{
                                ...theme.typography.bodyBold,
                                color: theme.colors.text,
                              }}
                              numberOfLines={1}
                            >
                              {item.user.name}
                            </Text>
                          </View>

                          <Rating
                            rating={item.user.rating ?? 0}
                            size={theme.spacing.iconSizeXSmall}
                            variant="compact"
                            style={{ marginTop: theme.spacing.xs }}
                          />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              width: theme.spacing.iconButtonHeight,
                              height: theme.spacing.iconButtonHeight,
                              borderRadius: theme.spacing.radiusRound,
                              backgroundColor: item.isPinned ? theme.colors.text : theme.colors.surfaceVariant,
                            },
                          ]}
                          disabled={togglePinMutation.isPending || unsubscribeMutation.isPending}
                          onPress={() => togglePinMutation.mutate({ userId: item.user.id, isPinned: !item.isPinned })}
                        >
                          <Pin
                            size={theme.spacing.iconSizeSmall}
                            color={item.isPinned ? theme.colors.textInverse : theme.colors.textSecondary}
                            fill={item.isPinned ? theme.colors.textInverse : 'none'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              width: theme.spacing.iconButtonHeight,
                              height: theme.spacing.iconButtonHeight,
                              borderRadius: theme.spacing.radiusRound,
                              backgroundColor: theme.colors.surfaceVariant,
                            },
                          ]}
                          disabled={unsubscribeMutation.isPending}
                          onPress={() => unsubscribeMutation.mutate(item.user.id)}
                        >
                          <UserMinus
                            size={theme.spacing.iconSizeSmall}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  infoCard: {
    borderBottomWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletedUser: {
    opacity: 0.5,
  },
});
