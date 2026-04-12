import React from 'react';
import { View } from 'react-native';
import { ActivityScheduleCalendar } from '@/components/forms/ActivityScheduleCalendar';
import { formatDateInputFromDateType } from '@/utils/date';
import { useTheme } from '@/themes/useTheme';
import type { FilterSectionProps } from '../types';

export function ScheduleFilterSection({ controller }: FilterSectionProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <ActivityScheduleCalendar
        variant="inputs"
        duration="period"
        headerVariant="default"
        isOpen={controller.isCalendarOpen}
        onToggle={controller.setIsCalendarOpen}
        startDate={controller.startDate}
        endDate={controller.endDate}
        startDateValue={controller.localFilters.dateFrom ?? ''}
        endDateValue={controller.localFilters.dateTo ?? ''}
        startTimeValue={controller.localFilters.timeFrom ?? ''}
        endTimeValue={controller.localFilters.timeTo ?? ''}
        onStartDateInput={controller.handleStartDateInput}
        onEndDateInput={controller.handleEndDateInput}
        onStartTimeInput={controller.handleStartTimeInput}
        onEndTimeInput={controller.handleEndTimeInput}
        onSingleChange={() => undefined}
        onRangeChange={({ startDate, endDate }) => {
          const start = formatDateInputFromDateType(startDate);
          if (!start) {
            controller.setLocalFilters((prev) => ({
              ...prev,
              dateFrom: '',
              dateTo: '',
            }));
            return;
          }

          const end = formatDateInputFromDateType(endDate);
          controller.setLocalFilters((prev) => ({
            ...prev,
            dateFrom: start,
            dateTo: end,
          }));
        }}
      />
    </View>
  );
}
