import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import {
  Ban,
  CalendarPlus2,
  CheckCircle2,
  Star,
  UserPlus,
  XCircle,
} from 'lucide-react-native';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Rating } from '@/components/ui/Rating';
import type { Gender, HistoryEventDto, HistoryEventType } from '@/types';
import { useTheme } from '@/themes/useTheme';

interface UserHistoryListProps {
  items: HistoryEventDto[];
  userGender?: Gender;
  style?: ViewStyle;
}

export function UserHistoryList({ items, userGender = 'notgiven', style }: UserHistoryListProps) {
  const theme = useTheme();

  const gendered = (male: string, female: string, neutral: string) => {
    if (userGender === 'male') return male;
    if (userGender === 'female') return female;
    return neutral;
  };

  const renderTypeIcon = (type: HistoryEventType) => {
    switch (type) {
      case 'organized':
        return <CalendarPlus2 size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />;
      case 'attended':
        return <CheckCircle2 size={theme.spacing.iconSizeMedium} color={theme.colors.ratingExcellent} />;
      case 'rated':
        return <Star size={theme.spacing.iconSizeMedium} color={theme.colors.ratingGood} />;
      case 'cancelled':
        return <Ban size={theme.spacing.iconSizeMedium} color={theme.colors.ratingPoor} />;
      case 'joined':
        return <UserPlus size={theme.spacing.iconSizeMedium} color={theme.colors.ratingFair} />;
      case 'missed':
        return <XCircle size={theme.spacing.iconSizeMedium} color={theme.colors.ratingPoor} />;
    }
  };

  const renderGenderedTypeLabel = (type: HistoryEventType) => {
    switch (type) {
      case 'organized':
        return `${gendered('Организовал', 'Организовала', 'Организовал(а)')} событие`;
      case 'attended':
        return `${gendered('Посетил', 'Посетила', 'Посетил(а)')} событие`;
      case 'rated':
        return `${gendered('Оценил', 'Оценила', 'Оценил(а)')} событие`;
      case 'cancelled':
        return `${gendered('Отменил', 'Отменила', 'Отменил(а)')} событие`;
      case 'joined':
        return `${gendered('Присоединился', 'Присоединилась', 'Присоединился(-ась)')} к событию`;
      case 'missed':
        return `${gendered('Пропустил', 'Пропустила', 'Пропустил(а)')} событие`;
    }
  };

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={`${item.type}-${item.occurredAt}-${item.activity.id}`} style={[styles.entry, style]}>
          <View style={styles.metaRow}>
            <View style={styles.typeIconBox}>{renderTypeIcon(item.type)}</View>
            <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>
              {renderGenderedTypeLabel(item.type)}
            </Text>
            <Text style={[styles.date, { color: theme.colors.textTertiary, ...theme.typography.captionSmall }]}>
              {new Date(item.occurredAt).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {item.type === 'rated' ? (
            <View style={styles.ratingRow}>
              {item.rating ? (
                <Rating
                  rating={item.rating}
                  size={12}
                  variant="compact"
                  style={styles.rating}
                  textStyle={{ ...theme.typography.captionSmall, color: theme.colors.text }}
                />
              ) : null}
              {item.ratingComment ? (
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                  {item.ratingComment}
                </Text>
              ) : null}
            </View>
          ) : null}

          <ActivityCard
            activity={item.activity}
            mode="list"
            variant="compact"
            showCTA={false}
            onPress={() => router.push(`/activity/${item.activity.id}`)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  entry: {
    gap: 8,
    marginTop: 12,
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
});
