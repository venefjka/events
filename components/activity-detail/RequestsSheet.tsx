import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';
import type { UserPublic } from '@/types';

interface RequestsSheetProps {
  visible: boolean;
  requests: UserPublic[];
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function RequestsSheet({
  visible,
  requests,
  onClose,
  onApprove,
  onReject,
}: RequestsSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleApprove = (participant: UserPublic) => {
    onApprove(participant.id);
  };

  const handleReject = (participant: UserPublic) => {
    onReject(participant.id);
  };

  const handleOpenUser = (participant: UserPublic) => {
    router.push(`/user/${participant.id}`);
  };

  return (
    <BottomSheetModal visible={visible} title="Заявки на участие" onClose={onClose}>
      {requests.length > 0 ? (
        <View style={styles.requestsList}>
          {requests.map((participant) => (
            <View
              key={participant.id}
              style={[styles.requestRow, { borderBottomColor: theme.colors.border }]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.requestUserInfo}
                onPress={() => handleOpenUser(participant)}
              >
                <Avatar name={participant.name} size="small" imageUrl={participant.avatar} />
                <Text
                  numberOfLines={1}
                  style={[styles.requestUserName, { color: theme.colors.text, ...theme.typography.bodyBold }]}
                >
                  {participant.name}
                </Text>
              </TouchableOpacity>

              <View style={styles.requestActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => handleReject(participant)}
                >
                  <X size={theme.spacing.iconSizeSmall} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleApprove(participant)}
                >
                  <Check size={theme.spacing.iconSizeSmall} color={theme.colors.textInverse} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: theme.colors.textSecondary, ...theme.typography.body }}>
          Пока новых заявок нет
        </Text>
      )}
    </BottomSheetModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    requestsList: {
      gap: theme.spacing.xs,
    },
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    requestUserInfo: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    requestUserName: {
      flex: 1,
    },
    requestActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconButton: {
      width: theme.spacing.iconButtonHeight,
      height: theme.spacing.iconButtonHeight,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
