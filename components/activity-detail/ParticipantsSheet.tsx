import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';
import type { UserPublic } from '@/types';

interface ParticipantsSheetProps {
  visible: boolean;
  participants: UserPublic[];
  organizerId: string;
  onClose: () => void;
  onParticipantPress: (participantId: string) => void;
}

export function ParticipantsSheet({
  visible,
  participants,
  organizerId,
  onClose,
  onParticipantPress,
}: ParticipantsSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <BottomSheetModal visible={visible} title="Участники" onClose={onClose}>
      {participants.length > 0 ? (
        <View style={styles.participantsSheetGrid}>
          {participants.map((participant) => {
            const isOrganizer = participant.id === organizerId;

            return (
              <TouchableOpacity
                key={participant.id}
                activeOpacity={0.85}
                style={styles.participantSheetCard}
                onPress={() => onParticipantPress(participant.id)}
              >
                <Avatar
                  name={participant.name}
                  size="medium"
                  imageUrl={participant.avatar}
                />
                {isOrganizer ? (
                  <View style={[styles.participantSheetSticker, { backgroundColor: theme.colors.background }]}>
                    <Crown size={theme.spacing.iconSizeXSmall - theme.spacing.xs / 2} color={theme.colors.text} />
                  </View>
                ) : null}
                <Text
                  numberOfLines={2}
                  style={[styles.participantSheetName, { color: theme.colors.text, ...theme.typography.captionSmall }]}
                >
                  {participant.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={{ color: theme.colors.textSecondary, ...theme.typography.body }}>Пока участников нет.</Text>
      )}
    </BottomSheetModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    participantsSheetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.sm,
      rowGap: theme.spacing.lg,
    },
    participantSheetCard: {
      width: '25%',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs * 2,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    participantSheetSticker: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.md,
      width: theme.spacing.xxl,
      height: theme.spacing.xxl,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: theme.spacing.xs,
      shadowOffset: {
        width: 0,
        height: theme.spacing.xs,
      },
      elevation: 3,
    },
    participantSheetName: {
      textAlign: 'center',
    },
  });
