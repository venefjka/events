import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pin, Users } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { useUsers } from '@/contexts/UsersContext';
import { createCommonStyles } from '@/styles/common';
import { useTheme } from '@/themes/useTheme';
import { Subscription, UserPublic } from '@/types';

type SubscriptionListItem = Subscription & {
  user: UserPublic;
};

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
  const { subscriptions, togglePin, isLoading } = useSubscriptions();
  const { getUserPublic } = useUsers();
  const theme = useTheme();
  const commonStyles = createCommonStyles(theme);

  const sortedUsers = useMemo<SubscriptionListItem[]>(() => {
    return subscriptions
      .reduce<SubscriptionListItem[]>((items, subscription) => {
        const user = getUserPublic(subscription.userId);

        if (!user) {
          return items;
        }

        items.push({ ...subscription, user });
        return items;
      }, [])
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }

        return left.user.name.localeCompare(right.user.name, 'ru');
      });
  }, [getUserPublic, subscriptions]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Header title="Подписки" showBackButton borderBottom={false} />

        {isLoading ? (
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
              style={[commonStyles.content, { backgroundColor: theme.colors.background }]}
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
                        style={styles.userMain}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/user/${item.user.id}`)}
                      >
                        <Avatar name={item.user.name} size="medium" imageUrl={item.user.avatar} />

                        <View style={[styles.userInfo, { marginLeft: theme.spacing.md }]}>
                          <View style={styles.nameRow}>
                            <Text
                              style={{
                                ...theme.typography.bodyBold,
                                color: theme.colors.text,
                              }}
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

                      <TouchableOpacity
                        style={[
                          styles.pinButton,
                          {
                            width: theme.spacing.iconButtonHeight,
                            height: theme.spacing.iconButtonHeight,
                            borderRadius: theme.spacing.radiusRound,
                            backgroundColor: item.isPinned ? theme.colors.text : theme.colors.surfaceVariant,
                          },
                        ]}
                        onPress={() => togglePin(item.user.id)}
                      >
                        <Pin
                          size={theme.spacing.iconSizeSmall}
                          color={item.isPinned ? theme.colors.textInverse : theme.colors.textSecondary}
                          fill={item.isPinned ? theme.colors.textInverse : 'none'}
                        />
                      </TouchableOpacity>
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
  pinButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
