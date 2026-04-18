import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';
import type { UserPublic } from '@/types';

interface PeopleSummarySectionProps {
  organizer: UserPublic;
  participantPreview: UserPublic[];
  participantsCountLabel: string;
  onOrganizerPress: () => void;
  onParticipantsPress: () => void;
}

export function PeopleSummarySection({
  organizer,
  participantPreview,
  participantsCountLabel,
  onOrganizerPress,
  onParticipantsPress,
}: PeopleSummarySectionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.85} style={styles.organizerButton} onPress={onOrganizerPress}>
        <Avatar name={organizer.name} size="medium" imageUrl={organizer.avatar} />
        <View style={styles.organizerContent}>
          <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>Организатор</Text>
          <Text numberOfLines={1} style={{ color: theme.colors.text, ...theme.typography.bodyLargeBold }}>
            {organizer.name}
          </Text>
          <Rating rating={organizer.rating} size={theme.spacing.iconSizeXSmall} variant="compact" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={onParticipantsPress} style={styles.participantsButton}>
        <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>Участники</Text>
        <View style={styles.participantsRow}>
          <View style={styles.avatarGroup}>
            {participantPreview.map((participant, index) => (
              <Avatar
                key={participant.id}
                name={participant.name}
                size="small"
                imageUrl={participant.avatar}
                style={[
                  styles.participantAvatar,
                  {
                    marginLeft: index === 0 ? 0 : -theme.spacing.sm,
                    zIndex: participantPreview.length - index,
                    borderColor: theme.colors.background,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.participantsCount, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
            {participantsCountLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
    },
    organizerButton: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    organizerContent: {
      flex: 1,
      minWidth: 0,
      gap: theme.spacing.xs / 2,
    },
    participantsButton: {
      flexShrink: 0,
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    participantsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    avatarGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    participantAvatar: {
      borderWidth: theme.spacing.borderWidth + theme.spacing.borderWidth / 2,
      borderColor: '#fff',
    },
    participantsCount: {
      minWidth: theme.spacing.iconButtonHeight,
      textAlign: 'center',
    },
  });
