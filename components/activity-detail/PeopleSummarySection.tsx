import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';

export interface PersonSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
  isDeleted?: boolean;
}

interface PeopleSummarySectionProps {
  organizer: PersonSummary;
  participantPreview: PersonSummary[];
  participantsCountLabel: string;
  onOrganizerPress: () => void;
  onParticipantsPress?: () => void;
  organizerLabel?: string;
  showParticipants?: boolean;
  organizerActionLabel?: string;
  onOrganizerActionPress?: () => void;
}

export function PeopleSummarySection({
  organizer,
  participantPreview,
  participantsCountLabel,
  onOrganizerPress,
  onParticipantsPress,
  organizerLabel = 'Организатор',
  showParticipants = true,
  organizerActionLabel,
  onOrganizerActionPress,
}: PeopleSummarySectionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={organizer.isDeleted}
        style={[styles.organizerButton, organizer.isDeleted && styles.deletedPerson]}
        onPress={onOrganizerPress}
      >
        <Avatar
          name={organizer.name}
          size="medium"
          imageUrl={organizer.avatarUrl}
          isDeleted={organizer.isDeleted}
        />
        <View style={styles.organizerContent}>
          <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>{organizerLabel}</Text>
          <Text numberOfLines={1} style={{ color: theme.colors.text, ...theme.typography.bodyLargeBold }}>
            {organizer.name}
          </Text>
          {organizerActionLabel && onOrganizerActionPress ? (
            <TouchableOpacity activeOpacity={0.85} onPress={onOrganizerActionPress} style={styles.organizerActionButton}>
              <Text style={{ color: theme.colors.textTertiary, ...theme.typography.caption }}>
                {organizerActionLabel}
              </Text>
            </TouchableOpacity>
          ) : (
            <Rating rating={organizer.rating ?? 0} size={theme.spacing.iconSizeXSmall} variant="compact" />
          )}
        </View>
      </TouchableOpacity>

      {showParticipants ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onParticipantsPress} style={styles.participantsButton}>
          <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>Участники</Text>
          <View style={styles.participantsRow}>
            <View style={styles.avatarGroup}>
              {participantPreview.map((participant, index) => (
                <Avatar
                  key={participant.id}
                  name={participant.name}
                  size="small"
                  imageUrl={participant.avatarUrl}
                  isDeleted={participant.isDeleted}
                  style={[
                    styles.participantAvatar,
                    participant.isDeleted && styles.deletedPerson,
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
      ) : null}
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
    deletedPerson: {
      opacity: 0.55,
    },
    organizerContent: {
      flex: 1,
      minWidth: 0,
      gap: theme.spacing.xs / 2,
    },
    organizerActionButton: {
      alignSelf: 'flex-start',
      paddingTop: theme.spacing.xs / 2,
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
