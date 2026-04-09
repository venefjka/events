import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip } from './ui/Chip';
import { useTheme } from '../themes/useTheme';
import { TimeSegment } from '../types';

export interface TimeSegmentPickerProps {
  segments: Array<{ id: TimeSegment | null; label: string; time?: string; highlight?: boolean }>;
  selectedSegment: TimeSegment | null;
  onSegmentSelect: (segment: TimeSegment | null) => void;
}

export const TimeSegmentPicker: React.FC<TimeSegmentPickerProps> = ({
  segments,
  selectedSegment,
  onSegmentSelect,
}) => {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.screenPaddingHorizontal,
          gap: theme.spacing.md,
        },
      ]}
    >
      {segments.map((segment) => (
        <Chip
          key={segment.id}
          label={segment.label}
          selected={selectedSegment === segment.id}
          onPress={() => onSegmentSelect(segment.id)}
          variant={'bw'}
          size="medium"
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
});
