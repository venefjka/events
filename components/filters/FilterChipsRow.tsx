import React from 'react';
import { ScrollView } from 'react-native';
import { CalendarDays, MapPinned, ToolCase, SlidersHorizontal, Users } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/themes/useTheme';
import type { FilterState } from '@/types';
import type { FilterSectionKey } from './types';
import {
  getCategoryFilterSummary,
  getFormatFilterSummary,
  getParticipationFilterSummary,
  getPreferencesFilterSummary,
  getScheduleFilterSummary,
  getFilterSectionTitle,
  isFilterSectionActive,
} from './helpers';

interface FilterChipsRowProps {
  filters: FilterState;
  onPress: (key: FilterSectionKey) => void;
}

const SECTION_ORDER: FilterSectionKey[] = ['format', 'schedule', 'category', 'participation', 'preferences'];

export function FilterChipsRow({ filters, onPress }: FilterChipsRowProps) {
  const theme = useTheme();

  const getSummary = (key: FilterSectionKey) => {
    switch (key) {
      case 'format':
        return getFormatFilterSummary(filters);
      case 'category':
        return getCategoryFilterSummary(filters);
      case 'schedule':
        return getScheduleFilterSummary(filters);
      case 'participation':
        return getParticipationFilterSummary(filters);
      case 'preferences':
        return getPreferencesFilterSummary(filters);
      default:
        return '';
    }
  };

  const renderIcon = (key: FilterSectionKey, selected: boolean) => {
    const color = selected ? theme.colors.textInverse : theme.colors.textSecondary;
    const size = theme.spacing.iconSizeXSmall;

    switch (key) {
      case 'category':
        return <ToolCase size={size} color={color} />;
      case 'format':
        return <MapPinned size={size} color={color} />;
      case 'schedule':
        return <CalendarDays size={size} color={color} />;
      case 'participation':
        return <Users size={size} color={color} />;
      case 'preferences':
        return <SlidersHorizontal size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
        gap: theme.spacing.sm,
      }}
    >
      {SECTION_ORDER.map((key) => {
        const selected = isFilterSectionActive(filters, key);
        const title = getFilterSectionTitle(key);
        const summary = getSummary(key);
        const label = selected && summary ? summary : title;

        return (
          <Chip
            key={key}
            label={label}
            onPress={() => onPress(key)}
            selected={selected}
            size="small"
            variant="bw"
            icon={renderIcon(key, selected)}
          />
        );
      })}
    </ScrollView>
  );
}

