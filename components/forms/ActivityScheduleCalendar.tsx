import React, { useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import {
  ChevronLeft,
  ChevronRight,
  Clock2,
  Clock8,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { useTheme } from '@/themes/useTheme';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { parseDateInput, formatDateInputFromDateType, toEndOfDay, toStartOfDay } from '@/utils/date';
import 'dayjs/locale/ru';
import {
  CALENDAR_DAY_ROW_HEIGHT,
  CALENDAR_FIRST_DAY,
  CALENDAR_WEEKDAYS_HEIGHT,
  buildCalendarStyles,
  buildScheduleHeaderLabelFromDates,
  buildScheduleHeaderLabelFromInputs,
  getCalendarLabel,
  getWeeksInMonth,
  normalizeCalendarRange,
} from '../../utils/calendar';

// todo: refactor

type CalendarDuration = 'oneDay' | 'period';
type CalendarHeaderVariant = 'custom' | 'default';

type BaseCalendarProps = {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  startDate?: Date;
  endDate?: Date;
  headerVariant?: CalendarHeaderVariant;
};

type CalendarInputsProps = {
  variant: 'inputs';
  duration: CalendarDuration;
  showInputs?: boolean;
  showTimeInputs?: boolean;
  startDateValue: string;
  endDateValue: string;
  startTimeValue: string;
  endTimeValue: string;
  startDateError?: string;
  endDateError?: string;
  startTimeError?: string;
  endTimeError?: string;
  onStartDateInput: (text: string) => void;
  onEndDateInput: (text: string) => void;
  onStartTimeInput: (text: string) => void;
  onEndTimeInput: (text: string) => void;
  onSingleChange: ({ date }: { date?: DateType }) => void;
  onRangeChange: ({ startDate, endDate }: { startDate?: DateType; endDate?: DateType }) => void;
};

type CalendarRangePickerOnlyProps = {
  variant: 'picker-only';
  duration?: 'period';
  onRangeChange: ({ startDate, endDate }: { startDate?: DateType; endDate?: DateType }) => void;
};

type CalendarSinglePickerOnlyProps = {
  variant: 'picker-only';
  duration: 'oneDay';
  onSingleChange: ({ date }: { date?: DateType }) => void;
};

type ActivityScheduleCalendarProps = BaseCalendarProps & (
  | CalendarInputsProps
  | CalendarRangePickerOnlyProps
  | CalendarSinglePickerOnlyProps
);


type CollapsedCalendarButtonProps = {
  label: string;
  onPress: () => void;
};

const CollapsedCalendarButton: React.FC<CollapsedCalendarButtonProps> = ({ label, onPress }) => {
  const theme = useTheme();

  return (
    <Button
      title={label}
      onPress={onPress}
      size="small"
      variant="primary"
      style={{ borderRadius: 1000, height: theme.spacing.inputHeight }}
      icon={<Maximize2 size={theme.spacing.iconSizeSmall} color={theme.colors.background} />}
    />
  );
};

type CustomCalendarHeaderProps = {
  calendarLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClose: () => void;
};

const CustomCalendarHeader: React.FC<CustomCalendarHeaderProps> = ({
  calendarLabel,
  onPrevMonth,
  onNextMonth,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingBottom: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.sm,
      }}
    >
      <View style={styles.calendarHeaderRow}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7}>
          <ChevronLeft size={theme.spacing.iconSizeLarge} color={theme.colors.primary} />
        </TouchableOpacity>

        <Text style={{ ...theme.typography.bodyBold, color: theme.colors.text }}>
          {calendarLabel}
        </Text>

        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7}>
          <ChevronRight size={theme.spacing.iconSizeLarge} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Minimize2 size={theme.spacing.iconSize} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

type ScheduleInputsSectionProps = {
  duration: CalendarDuration;
  isOpen: boolean;
  showTimeInputs: boolean;
  inputsMaxHeight: number;
  startDateValue: string;
  endDateValue: string;
  startTimeValue: string;
  endTimeValue: string;
  startDateError?: string;
  endDateError?: string;
  startTimeError?: string;
  endTimeError?: string;
  onStartDateInput: (text: string) => void;
  onEndDateInput: (text: string) => void;
  onStartTimeInput: (text: string) => void;
  onEndTimeInput: (text: string) => void;
};

const ScheduleInputsSection: React.FC<ScheduleInputsSectionProps> = ({
  duration,
  isOpen,
  showTimeInputs,
  inputsMaxHeight,
  startDateValue,
  endDateValue,
  startTimeValue,
  endTimeValue,
  startDateError,
  endDateError,
  startTimeError,
  endTimeError,
  onStartDateInput,
  onEndDateInput,
  onStartTimeInput,
  onEndTimeInput,
}) => {
  const theme = useTheme();
  const inputsAnim = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(inputsAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [inputsAnim, isOpen]);

  return (
    <Animated.View
      style={{
        maxHeight: inputsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, inputsMaxHeight],
        }),
        opacity: inputsAnim,
        overflow: 'hidden',
      }}
    >
      <View style={[styles.inputsBlock, { paddingTop: theme.spacing.lg }]}>
        <View style={styles.row}>
          <Text
            style={{
              ...theme.typography.label,
              color: theme.colors.text,
              width: '16%',
              marginTop: theme.spacing.lg,
            }}
          >
            Начало
          </Text>

          <FormField
            label=""
            value={startDateValue}
            onChangeText={onStartDateInput}
            placeholder="ДД.ММ.ГГГГ"
            keyboardType="number-pad"
            error={startDateError}
            maxLength={10}
            style={{ width: showTimeInputs ? '38%' : '80%', marginBottom: 0 }}
          />

          {showTimeInputs && (
            <FormField
              label=""
              value={startTimeValue}
              onChangeText={onStartTimeInput}
              placeholder="12:00"
              keyboardType="number-pad"
              error={startTimeError}
              maxLength={5}
              style={{ width: '33%', marginBottom: 0 }}
              icon={<Clock2 size={theme.spacing.iconSize} color={theme.colors.disabled} />}
            />
          )}
        </View>

        <View style={[styles.row, { marginTop: theme.spacing.md }]}>
          <Text
            style={{
              ...theme.typography.label,
              color: theme.colors.text,
              width: '16%',
              marginTop: theme.spacing.lg,
            }}
          >
            Конец
          </Text>

          <FormField
            label=""
            value={duration === 'oneDay' ? startDateValue : endDateValue}
            onChangeText={onEndDateInput}
            placeholder="ДД.ММ.ГГГГ"
            keyboardType="number-pad"
            error={endDateError}
            maxLength={10}
            disabled={duration === 'oneDay'}
            style={{ width: showTimeInputs ? '38%' : '80%', marginBottom: 0 }}
          />

          {showTimeInputs && (
            <FormField
              label=""
              value={endTimeValue}
              onChangeText={onEndTimeInput}
              placeholder="18:00"
              keyboardType="number-pad"
              error={endTimeError}
              maxLength={5}
              style={{ width: '33%', marginBottom: 0 }}
              icon={<Clock8 size={theme.spacing.iconSize} color={theme.colors.disabled} />}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export const ActivityScheduleCalendar: React.FC<ActivityScheduleCalendarProps> = ({
  isOpen,
  onToggle,
  startDate,
  endDate,
  headerVariant = 'custom',
  ...rest
}) => {
  const theme = useTheme();
  const defaultStyles = useDefaultStyles();
  const minDate = useMemo(() => toStartOfDay(new Date()), []);
  const startDateForPicker = useMemo(
    () => (startDate ? toStartOfDay(startDate) : undefined),
    [startDate]
  );
  const endDateForPicker = useMemo(
    () => (endDate ? toEndOfDay(endDate) : undefined),
    [endDate]
  );

  const inputsProps = rest.variant === 'inputs' ? rest : undefined;
  const singlePickerProps = rest.variant === 'picker-only' && rest.duration === 'oneDay' ? rest : undefined;
  const rangePickerProps = rest.variant === 'picker-only' && rest.duration !== 'oneDay' ? rest : undefined;
  const duration = inputsProps?.duration ?? singlePickerProps?.duration ?? 'period';
  const shouldRenderInputs = inputsProps ? (inputsProps.showInputs ?? true) : false;
  const showTimeInputs = inputsProps ? (inputsProps.showTimeInputs ?? true) : false;
  const focusDate = duration === 'period' ? endDate ?? startDate : startDate;
  const initialCalendarDate = startDate ?? endDate ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState<number>(() => initialCalendarDate.getMonth());
  const [visibleYear, setVisibleYear] = useState<number>(() => initialCalendarDate.getFullYear());

  React.useEffect(() => {
    if (!focusDate) {
      return;
    }

    setVisibleMonth(focusDate.getMonth());
    setVisibleYear(focusDate.getFullYear());
  }, [focusDate]);

  const weeksInMonth = useMemo(
    () => getWeeksInMonth(visibleYear, visibleMonth, CALENDAR_FIRST_DAY),
    [visibleMonth, visibleYear]
  );

  const calendarLabel = useMemo(
    () => getCalendarLabel(visibleYear, visibleMonth),
    [visibleMonth, visibleYear]
  );

  const calendarStyles = useMemo(
    () => buildCalendarStyles(defaultStyles as Record<string, unknown>, weeksInMonth),
    [defaultStyles, weeksInMonth]
  );

  const computedCalendarHeight = useMemo(
    () => CALENDAR_WEEKDAYS_HEIGHT + CALENDAR_DAY_ROW_HEIGHT * weeksInMonth,
    [weeksInMonth]
  );

  const pickerHeaderHeight = headerVariant === 'default' ? theme.spacing.inputHeight : 0;
  const visibleCalendarHeight = isOpen ? computedCalendarHeight + pickerHeaderHeight : 0;
  const calendarHeightAnim = React.useRef(new Animated.Value(visibleCalendarHeight)).current;
  const calendarOpacityAnim = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(calendarHeightAnim, {
        toValue: visibleCalendarHeight,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(calendarOpacityAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [calendarHeightAnim, calendarOpacityAnim, isOpen, visibleCalendarHeight]);

  const inputsMaxHeight = showTimeInputs
    ? theme.spacing.inputHeight * 2 + theme.spacing.lg * 3 + theme.spacing.md + theme.spacing.xl
    : theme.spacing.inputHeight * 2 + theme.spacing.lg * 2 + theme.spacing.md;

  const collapsedLabel = inputsProps
    ? buildScheduleHeaderLabelFromInputs({
        startDateValue: inputsProps.startDateValue,
        endDateValue: inputsProps.endDateValue,
        startTimeValue: inputsProps.startTimeValue,
        endTimeValue: inputsProps.endTimeValue,
      })
    : buildScheduleHeaderLabelFromDates(startDate, endDate);

  const handlePrevMonth = React.useCallback(() => {
    const next = new Date(visibleYear, visibleMonth - 1, 1);
    setVisibleMonth(next.getMonth());
    setVisibleYear(next.getFullYear());
  }, [visibleMonth, visibleYear]);

  const handleNextMonth = React.useCallback(() => {
    const next = new Date(visibleYear, visibleMonth + 1, 1);
    setVisibleMonth(next.getMonth());
    setVisibleYear(next.getFullYear());
  }, [visibleMonth, visibleYear]);

  const handleMonthChange = React.useCallback((month: number) => {
    setVisibleMonth(month);
  }, []);

  const handleYearChange = React.useCallback((year: number) => {
    setVisibleYear(year);
  }, []);

  const handleSingleChange = React.useCallback(
    ({ date }: { date?: DateType }) => {
      const emitSingleChange = inputsProps?.onSingleChange ?? singlePickerProps?.onSingleChange;

      if (!emitSingleChange) {
        return;
      }

      const currentKey = formatDateInputFromDateType(startDate);
      const nextKey = formatDateInputFromDateType(date);

      if (nextKey && currentKey && nextKey === currentKey) {
        emitSingleChange({ date: undefined });
        return;
      }

      emitSingleChange({ date });
    },
    [inputsProps, singlePickerProps, startDate]
  );

  const rangeRef = React.useRef<{ start?: string; end?: string }>({
    start: formatDateInputFromDateType(startDate) || undefined,
    end: formatDateInputFromDateType(endDate) || undefined,
  });

  React.useEffect(() => {
    rangeRef.current = {
      start: formatDateInputFromDateType(startDate) || undefined,
      end: formatDateInputFromDateType(endDate) || undefined,
    };
  }, [endDate, startDate]);

  const rangeChangeHandler = React.useCallback(
    ({ startDate: nextStart, endDate: nextEnd }: { startDate?: DateType; endDate?: DateType }) => {
      const emitRangeChange = inputsProps?.onRangeChange ?? rangePickerProps?.onRangeChange;

      if (!emitRangeChange) {
        return;
      }

      const nextStartKey = formatDateInputFromDateType(nextStart) || undefined;
      const nextEndKey = formatDateInputFromDateType(nextEnd) || undefined;
      const setLastRange = (startKey?: string, endKey?: string) => {
        rangeRef.current = normalizeCalendarRange(startKey, endKey);
      };
      const clearRange = () => {
        emitRangeChange({ startDate: undefined, endDate: undefined });
        setLastRange(undefined, undefined);
      };
      const setSingle = (key?: string, fallback?: Date) => {
        const preserved = key ? parseDateInput(key) : undefined;
        const value = preserved ?? fallback;

        if (!value) {
          clearRange();
          return;
        }

        emitRangeChange({ startDate: value, endDate: value });
        setLastRange(key, key);
      };

      const last = normalizeCalendarRange(rangeRef.current.start, rangeRef.current.end);

      if (!nextStartKey) {
        clearRange();
        return;
      }

      if (!nextEndKey) {
        if (last.start && last.end) {
          if (nextStartKey === last.end) {
            setSingle(last.start, startDate);
            return;
          }

          if (nextStartKey === last.start) {
            setSingle(last.end, endDate);
            return;
          }
        } else if (last.start && nextStartKey === last.start) {
          clearRange();
          return;
        }

        setSingle(nextStartKey);
        return;
      }

      if (last.start && last.end) {
        if (nextStartKey === last.start && nextEndKey === last.start) {
          setSingle(last.end, endDate);
          return;
        }

        if (nextStartKey === last.end && nextEndKey === last.end) {
          setSingle(last.start, startDate);
          return;
        }

        if (nextStartKey === last.start && nextEndKey === last.end) {
          return;
        }
      }

      emitRangeChange({ startDate: nextStart, endDate: nextEnd });
      setLastRange(nextStartKey, nextEndKey);
    },
    [endDate, inputsProps, rangePickerProps, startDate]
  );

  const isRangeMode = duration === 'period';

  return (
    <View>
      {!isOpen && <CollapsedCalendarButton label={collapsedLabel} onPress={() => onToggle(true)} />}

      {isOpen && headerVariant === 'custom' && (
        <CustomCalendarHeader
          calendarLabel={calendarLabel}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onClose={() => onToggle(false)}
        />
      )}

      {isOpen && headerVariant === 'default' && (
        <View style={[styles.defaultHeaderActions, { marginBottom: theme.spacing.sm }]}>
          <TouchableOpacity onPress={() => onToggle(false)} activeOpacity={0.7}>
            <Minimize2 size={theme.spacing.iconSize} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={{ height: calendarHeightAnim, opacity: calendarOpacityAnim, overflow: 'hidden' }}>
        {isRangeMode ? (
          <DateTimePicker
            mode="range"
            minDate={minDate}
            startDate={startDateForPicker}
            endDate={endDateForPicker}
            onChange={rangeChangeHandler}
            styles={calendarStyles}
            containerHeight={computedCalendarHeight}
            weekdaysHeight={CALENDAR_WEEKDAYS_HEIGHT}
            firstDayOfWeek={CALENDAR_FIRST_DAY}
            month={visibleMonth}
            year={visibleYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            hideHeader={headerVariant === 'custom'}
            locale="ru"
          />
        ) : (
          <DateTimePicker
            mode="single"
            minDate={minDate}
            date={startDateForPicker}
            onChange={handleSingleChange}
            styles={calendarStyles}
            containerHeight={computedCalendarHeight}
            weekdaysHeight={CALENDAR_WEEKDAYS_HEIGHT}
            firstDayOfWeek={CALENDAR_FIRST_DAY}
            month={visibleMonth}
            year={visibleYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            hideHeader={headerVariant === 'custom'}
            locale="ru"
          />
        )}
      </Animated.View>

      {shouldRenderInputs && (
        <ScheduleInputsSection
          duration={duration}
          isOpen={isOpen}
          showTimeInputs={showTimeInputs}
          inputsMaxHeight={inputsMaxHeight}
          startDateValue={inputsProps?.startDateValue ?? ''}
          endDateValue={inputsProps?.endDateValue ?? ''}
          startTimeValue={inputsProps?.startTimeValue ?? ''}
          endTimeValue={inputsProps?.endTimeValue ?? ''}
          startDateError={inputsProps?.startDateError}
          endDateError={inputsProps?.endDateError}
          startTimeError={inputsProps?.startTimeError}
          endTimeError={inputsProps?.endTimeError}
          onStartDateInput={inputsProps?.onStartDateInput ?? (() => undefined)}
          onEndDateInput={inputsProps?.onEndDateInput ?? (() => undefined)}
          onStartTimeInput={inputsProps?.onStartTimeInput ?? (() => undefined)}
          onEndTimeInput={inputsProps?.onEndTimeInput ?? (() => undefined)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultHeaderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  inputsBlock: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

