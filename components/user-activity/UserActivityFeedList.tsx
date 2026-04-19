import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import {
  Ban,
  CalendarPlus2,
  CheckCircle2,
  LogOut,
  Star,
  UserPlus,
  XCircle,
} from 'lucide-react-native';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Rating } from '@/components/ui/Rating';
import type { UserActivityFeedItem } from '@/utils/userActivityFeed';
import type { UserActivityFeedEventType } from '@/types';
import { useTheme } from '@/themes/useTheme';

interface UserActivityFeedListProps {
  items: UserActivityFeedItem[];
  style?: ViewStyle;
}

export function UserActivityFeedList({ items, style }: UserActivityFeedListProps) {
  const theme = useTheme();

  const renderTypeIcon = (type: UserActivityFeedEventType) => {
    switch (type) {
      case 'created':
        return <CalendarPlus2 size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />;
      case 'attended':
        return <CheckCircle2 size={theme.spacing.iconSizeMedium} color={theme.colors.ratingExcellent} />;
      case 'rated':
        return <Star size={theme.spacing.iconSizeMedium} color={theme.colors.ratingGood} />;
      case 'cancelled':
        return <Ban size={theme.spacing.iconSizeMedium} color={theme.colors.ratingPoor} />;
      case 'joined':
        return <UserPlus size={theme.spacing.iconSizeMedium} color={theme.colors.info} />;
      case 'leaved':
        return <LogOut size={theme.spacing.iconSizeMedium} color={theme.colors.ratingFair} />;
      case 'missed':
        return <XCircle size={theme.spacing.iconSizeMedium} color={theme.colors.ratingPoor} />;
    }
  };

  const renderTypeLabel = (type: UserActivityFeedEventType) => {
    switch (type) {
      case 'created':
        return 'Создал событие';
      case 'attended':
        return 'Посетил событие';
      case 'rated':
        return 'Оценил событие';
      case 'cancelled':
        return 'Отменил событие';
      case 'joined':
        return 'Присоединился к событию';
      case 'leaved':
        return 'Отменил участие';
      case 'missed':
        return 'Пропустил событие';
    }
  };

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={[styles.entry, style]}>
          <View style={styles.metaRow}>
            <View style={styles.typeIconBox}>
              {renderTypeIcon(item.type)}
            </View>
            <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>
              {renderTypeLabel(item.type)}
            </Text>
            <Text style={[styles.date, { color: theme.colors.textTertiary, ...theme.typography.captionSmall }]}>
              {new Date(item.timestamp).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {item.type === 'rated' && (typeof item.ratingValue === 'number' || item.subtitle) ? (
            <View style={styles.ratingRow}>
              {typeof item.ratingValue === 'number' ? (
                <Rating
                  rating={item.ratingValue}
                  size={12}
                  variant="compact"
                  style={styles.rating}
                  textStyle={{ ...theme.typography.captionSmall, color: theme.colors.text }}
                />
              ) : null}
              {item.subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          ) : item.subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
              {item.subtitle}
            </Text>
          ) : null}

          {item.activity ? (
            <ActivityCard
              activity={item.activity}
              mode="list"
              variant="compact"
              showCTA={false}
              onPress={() => router.push(`/activity/${item.activity!.id}`)}
            />
          ) : (
            <View style={[styles.fallbackCard, { backgroundColor: theme.colors.surface, marginBottom: theme.spacing.md }]}>
              <Text style={{ color: theme.colors.text, ...theme.typography.bodyBold }}>
                {item.title}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
  },
  entry: {
    gap: 8,
    marginTop: 12
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  typeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    marginLeft: 'auto',
  },
  rating: {
    flexShrink: 0,
    marginTop: 1,
  },
  subtitle: {
    flex: 1,
  },
  fallbackCard: {
    borderRadius: 16,
    padding: 12,
  },
});
