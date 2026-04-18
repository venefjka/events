import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useTheme } from '@/themes/useTheme';

interface FilterBottomSheetModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  showFooter?: boolean;
}

export function FilterBottomSheetModal({
  visible,
  title,
  children,
  onClose,
  onApply,
  onReset,
  showFooter = true,
}: FilterBottomSheetModalProps) {
  const theme = useTheme();

  const footer = showFooter ? (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
        paddingTop: theme.spacing.screenPaddingVertical,
        paddingBottom: theme.spacing.screenPaddingVertical,
        gap: theme.spacing.md,
      }}
    >
      <Button title="Сбросить" variant="secondary" onPress={onReset ?? onClose} style={{ flex: 1 }} />
      <Button title="Применить" variant="primary" onPress={onApply ?? onClose} style={{ flex: 1.6 }} />
    </View>
  ) : null;

  return (
    <BottomSheetModal
      visible={visible}
      title={title}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </BottomSheetModal>
  );
}
