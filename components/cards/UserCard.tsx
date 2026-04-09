import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Rating } from '../ui/Rating';
import { useTheme } from '../../themes/useTheme';
import { UserPublic } from '../../types';

export interface UserCardProps {
  user: UserPublic;
  onPress?: () => void;
  showRating?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact';
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  showRating = true,
  showStats = false,
  variant = 'default',
}) => {
  const theme = useTheme();

  return (
    <Card onPress={onPress} variant="outlined" padding="medium">
      <View style={styles.container}>
        <Avatar name={user.name} size={variant === 'compact' ? 'small' : 'medium'} imageUrl={user.avatar} />
        
        <View style={[styles.info, { marginLeft: theme.spacing.md }]}>
          <Text
            style={[
              styles.name,
              {
                ...theme.typography.bodyBold,
                color: theme.colors.text,
              },
            ]}
          >
            {user.name}
          </Text>
          
          {variant !== 'compact' && typeof user.age === 'number' && (
            <Text
              style={[
                styles.age,
                {
                  ...theme.typography.caption,
                  color: theme.colors.textSecondary,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              {user.age} лет
            </Text>
          )}

          {showRating && (
            <View style={{ marginTop: theme.spacing.xs }}>
              <Rating rating={user.rating} size={14} variant="compact" />
            </View>
          )}

          {showStats &&
            variant !== 'compact' &&
            (typeof user.createdEventsCount === 'number' || typeof user.joinedEventsCount === 'number') && (
            <View style={[styles.stats, { marginTop: theme.spacing.sm }]}>
              <Text
                style={[
                  styles.stat,
                  {
                    ...theme.typography.caption,
                    color: theme.colors.textSecondary,
                    marginRight: theme.spacing.md,
                  },
                ]}
              >
                Создано: {user.createdEventsCount ?? 0}
              </Text>
              <Text
                style={[
                  styles.stat,
                  {
                    ...theme.typography.caption,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Посещено: {user.joinedEventsCount ?? 0}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
  },
  age: {
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    marginRight: 16,
  },
});



