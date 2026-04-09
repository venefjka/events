import React, { useMemo, useState } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { RefreshCw, RefreshCwOff, Calendar1, CalendarRange, Clock } from 'lucide-react-native';
import { useTheme } from '@/themes/useTheme';
import { FormField } from '@/components/forms/FormField';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { formatDateInput, formatTimeInput } from '@/utils/formatInput';
import { DropdownChipSelector } from '@/components/forms/DropdownChipSelector';
import { DateType } from 'react-native-ui-datepicker';
import { Button } from '@/components/ui/Button';
import { ActivityFormat } from '@/types';
import {
  UtcOffsetOption,
  getDefaultUtcOffsetOption,
  getDeviceTimeZone,
  getTimeZoneFromLocation,
  getUtcOffsetOptionByTimeZone,
  getUtcOffsetOptions,
} from '@/utils/timezone';
import { parseDateInput, formatDateInputFromDateType } from '../../../utils/date';
import { ActivityScheduleCalendar } from '../../../components/forms/ActivityScheduleCalendar';


interface ActivityScheduleStepProps {
  data: any;
  updateData: (data: any) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

type IsRepeatingFormat = 'yes' | 'no';

const isRepeatingItems = [
  {
    id: 'yes' as IsRepeatingFormat,
    label: 'Да',
    renderIcon: ({ color, size }: { color: string; size: number }) => <RefreshCw size={size} color={color} />,
  },
  {
    id: 'no' as IsRepeatingFormat,
    label: 'Нет',
    renderIcon: ({ color, size }: { color: string; size: number }) => <RefreshCwOff size={size} color={color} />,
  },
]

type RepeatOptions = 'weekly' | 'every2weeks' | 'monthly';

const repeatOptions = [
  { id: 'weekly', label: 'Каждую неделю' },
  { id: 'every2weeks', label: 'Каждые 2 недели' },
  { id: 'monthly', label: 'Каждый месяц' },
];

type Duration = 'oneDay' | 'period';

const durationOptions = [
  {
    id: 'oneDay' as Duration,
    label: 'Один день',
    renderIcon: ({ color, size }: { color: string; size: number }) => <Calendar1 size={size} color={color} />
  },
  {
    id: 'period' as Duration,
    label: 'Период',
    renderIcon: ({ color, size }: { color: string; size: number }) => <CalendarRange size={size} color={color} />,
  },
];

interface CollapsibleSectionProps {
  collapsed: boolean;
  maxHeight?: number;
  spacingTop?: number;
  spacingBottom?: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  collapsed,
  maxHeight = 1000,
  spacingTop = 0,
  spacingBottom = 0,
  children,
}) => {
  const animation = React.useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: collapsed ? 0 : 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [animation, collapsed]);

  const containerStyle = {
    overflow: 'hidden' as const,
    opacity: animation,
    maxHeight: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxHeight],
    }),
    marginTop: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, spacingTop],
    }),
    marginBottom: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, spacingBottom],
    }),
  };

  return (
    <Animated.View style={containerStyle}>
      {children}
    </Animated.View>
  );
};


export const ActivityScheduleStep: React.FC<ActivityScheduleStepProps> = ({
  data,
  updateData,
  errors,
  showErrors,
}) => {
  const theme = useTheme();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [timeZoneError, setTimeZoneError] = useState<string | undefined>(undefined);

  const startDateError = showErrors ? errors?.startDate : undefined;
  const endDateError = showErrors ? errors?.endDate : undefined;
  const endRepeatDateError = showErrors ? errors?.endRepeatDate : undefined;
  const startTimeError = showErrors ? errors?.startTime : undefined;
  const endTimeError = showErrors ? errors?.endTime : undefined;
  const timeZoneValidationError = showErrors ? errors?.timeZone : undefined;

  const repeatId: RepeatOptions = data.repeat ?? 'weekly';
  const isRepeatingId: IsRepeatingFormat = data.isRepeating ?? 'no';
  const duration: Duration = data.duration ?? 'oneDay';
  const formatId: ActivityFormat = data.format ?? 'offline';
  const startDateValue = data.startDate ?? '';
  const endDateValue = data.endDate ?? '';
  const startDate = useMemo(() => parseDateInput(startDateValue), [startDateValue]);
  const endDate = useMemo(() => parseDateInput(endDateValue), [endDateValue]);

  const timeZoneOptions = useMemo(() => getUtcOffsetOptions(), []);
  const selectedTimeZone = timeZoneOptions.find((option) => option.id === data.timeZone);
  const deviceTimeZoneOption = useMemo(() => {
    const deviceTimeZone = getDeviceTimeZone();
    return deviceTimeZone ? getUtcOffsetOptionByTimeZone(deviceTimeZone) : undefined;
  }, []);
  const isDeviceTimeZoneSelected = Boolean(
    deviceTimeZoneOption && selectedTimeZone && deviceTimeZoneOption.id === selectedTimeZone.id
  );
  const isTimeZoneLocked = formatId === 'offline';
  const isTimeZoneButtonActive = isDeviceTimeZoneSelected && !isTimeZoneLocked;

  const applyTimeZone = React.useCallback((option: UtcOffsetOption) => {
    updateData({
      timeZone: option.id,
      timeZoneLabel: option.label,
      timeZoneVerified: true,
    });
    setTimeZoneError(undefined);
  }, [updateData]);

  const handleDetectTimeZone = React.useCallback(() => {
    if (isDetecting || isTimeZoneLocked) return;
    setIsDetecting(true);
    setTimeZoneError(undefined);

    const deviceTimeZone = getDeviceTimeZone();
    const option = deviceTimeZone
      ? getUtcOffsetOptionByTimeZone(deviceTimeZone)
      : undefined;
    if (!option) {
      const fallback = getDefaultUtcOffsetOption();
      applyTimeZone(fallback);
      setTimeZoneError('Не удалось определить таймзону, выбран UTC+00:00');
      setIsDetecting(false);
      return;
    }

    applyTimeZone(option);
    setIsDetecting(false);
  }, [applyTimeZone, isDetecting, isTimeZoneLocked]);

  React.useEffect(() => {
    if (formatId !== 'offline') return;
    const locationTimeZone = getTimeZoneFromLocation(
      data.location?.latitude,
      data.location?.longitude
    );
    const option = locationTimeZone
      ? getUtcOffsetOptionByTimeZone(locationTimeZone)
      : undefined;
    const fallback = option ?? getDefaultUtcOffsetOption();
    if (!selectedTimeZone || selectedTimeZone.id !== fallback.id) {
      applyTimeZone(fallback);
    }
  }, [
    applyTimeZone,
    data.location?.latitude,
    data.location?.longitude,
    formatId,
    selectedTimeZone,
  ]);

  const handleDurationChange = React.useCallback((id: Duration) => {
    if (id === 'oneDay') {
      const nextDate = startDateValue.trim() || endDateValue.trim();
      updateData({
        duration: id,
        startDate: nextDate,
        endDate: nextDate,
      });
      return;
    }
    updateData({ duration: id });
  }, [endDateValue, startDateValue, updateData]);

  const handleSingleChange = React.useCallback(({ date }: { date?: DateType }) => {
    const nextDate = formatDateInputFromDateType(date);
    if (!nextDate) {
      updateData({ startDate: '', endDate: '' });
      return;
    }
    updateData({ startDate: nextDate, endDate: nextDate });
  }, [updateData]);

  const handleRangeChange = React.useCallback(({ startDate, endDate }: { startDate?: DateType; endDate?: DateType }) => {
    const nextStart = formatDateInputFromDateType(startDate);
    if (!nextStart) {
      updateData({ startDate: '', endDate: '' });
      return;
    }
    updateData({
      startDate: nextStart,
      endDate: formatDateInputFromDateType(endDate),
    });
  }, [updateData]);

  const handleStartDateInput = React.useCallback((text: string) => {
    const nextValue = formatDateInput(text);
    if (duration === 'oneDay') {
      updateData({ startDate: nextValue, endDate: nextValue });
      return;
    }
    updateData({ startDate: nextValue });
  }, [duration, updateData]);

  const handleEndDateInput = React.useCallback((text: string) => {
    updateData({ endDate: formatDateInput(text) });
  }, [updateData]);

  return (
    <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>
      <View>

      <ActivityScheduleCalendar
          variant="inputs"
          duration={duration}
          isOpen={isCalendarOpen}
          onToggle={setIsCalendarOpen}
          startDate={startDate}
          endDate={endDate}
          startDateValue={data.startDate || ''}
          endDateValue={data.endDate || ''}
          startTimeValue={data.startTime || ''}
          endTimeValue={data.endTime || ''}
          startDateError={startDateError}
          endDateError={endDateError}
          startTimeError={startTimeError}
          endTimeError={endTimeError}
          onStartDateInput={handleStartDateInput}
          onEndDateInput={handleEndDateInput}
          onStartTimeInput={(text) => updateData({ startTime: formatTimeInput(text) })}
          onEndTimeInput={(text) => updateData({ endTime: formatTimeInput(text) })}
          onSingleChange={handleSingleChange}
          onRangeChange={handleRangeChange}
        />


        <CollapsibleSection collapsed={isCalendarOpen} spacingTop={theme.spacing.xxxl}>
          <View style={[styles.row, { width: '100%', alignItems: 'center' }]}>
            <Text style={{
              ...theme.typography.label,
              color: theme.colors.text,
            }}>
              {'Длительность\nсобытия'}
            </Text>
            <ExpandableTabBar<Duration>
              items={durationOptions}
              activeId={duration}
              onChange={handleDurationChange}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.7}
              containerStyle={{ width: '65%' }}
            />
          </View>
        </CollapsibleSection>

        <CollapsibleSection collapsed={isCalendarOpen} spacingTop={theme.spacing.xxxl}>
          <View>
            <View style={[styles.row, { width: '100%', alignItems: 'center' }]}>
              <Text style={{
                ...theme.typography.label,
                color: theme.colors.text,
              }}>
                {'Часовой\nпояс'}
              </Text>

              <View style={{ width: '45%' }}>
                <DropdownChipSelector
                  label=""
                  value={selectedTimeZone?.id ?? ''}
                  items={timeZoneOptions.map((option) => ({
                    id: option.id,
                    label: option.label,
                  }))}
                  onSelect={(id) => {
                    if (isTimeZoneLocked) return;
                    const option = timeZoneOptions.find((item) => item.id === id);
                    if (option) {
                      applyTimeZone(option);
                    }
                  }}
                  allowClear={false}
                  dropdownPlacement="above"
                  disabled={isTimeZoneLocked}
                />
                {!!(timeZoneError || timeZoneValidationError) && (
                  <Text style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                    {timeZoneError || timeZoneValidationError}
                  </Text>
                )}
              </View>
              {isTimeZoneLocked ? (
                <Text
                  style={{
                    ...theme.typography.caption,
                    color: theme.colors.textSecondary,
                    width: '27%',
                    textAlign: 'center',
                  }}
                >
                  Определен по локации
                </Text>
              ) : (
                <Button
                  title="Мой"
                  onPress={handleDetectTimeZone}
                  size="small"
                  icon={
                    <Clock
                      size={theme.spacing.iconSize}
                      color={isTimeZoneButtonActive ? theme.colors.textInverse : theme.colors.textSecondary}
                    />
                  }
                  style={{
                    borderRadius: theme.spacing.radiusRound,
                    height: theme.spacing.inputHeight,
                    width: '27%',
                    backgroundColor: isTimeZoneButtonActive ? theme.colors.primary : theme.colors.surfaceVariant,
                  }}
                  textStyle={{
                    ...theme.typography.captionBold,
                    color: isTimeZoneButtonActive ? theme.colors.textInverse : theme.colors.textSecondary,
                  }}
                  loading={isDetecting}
                />
              )}
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection collapsed={isCalendarOpen} spacingTop={theme.spacing.xxxl}>
          <View style={{ width: '100%' }}>
            <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.md }}>
              Запланировать повтор
            </Text>
            <ExpandableTabBar<IsRepeatingFormat>
              items={isRepeatingItems}
              activeId={isRepeatingId}
              onChange={(id) => updateData({ isRepeating: id })}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.8}
            />
          </View>

          {isRepeatingId == 'yes' &&
            <>
              <View style={[{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: theme.spacing.xxxl
              }]}>
                <View style={{ width: '57%' }}>
                  <DropdownChipSelector
                    label='Частота'
                    value={repeatId}
                    items={repeatOptions.map((option) => ({
                      id: option.id,
                      label: option.label,
                    }))}
                    onSelect={(repeatId) => updateData({ repeat: repeatId })}
                    allowClear={false}
                    dropdownPlacement='above'
                  />
                </View>
                <FormField
                  label="Конец повтора"
                  value={data.endRepeatDate || ''}
                  onChangeText={(text) => updateData({ endRepeatDate: formatDateInput(text) })}
                  placeholder="ДД.ММ.ГГГГ"
                  keyboardType="number-pad"
                  error={endRepeatDateError}
                  maxLength={10}
                  style={{ width: "38%", marginBottom: 0 }}
                />
              </View>
            </>
          }
        </CollapsibleSection>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

