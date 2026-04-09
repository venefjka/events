import dayjs from 'dayjs';
import { formatTimeOnly, parseDateInput, parseTimeParts, formatDateInputFromDateType } from './date';

export const CALENDAR_FIRST_DAY = 1;
export const CALENDAR_WEEKDAYS_HEIGHT = 25;
export const CALENDAR_CONTAINER_HEIGHT = 300;
export const CALENDAR_DAY_ROW_HEIGHT =
  (CALENDAR_CONTAINER_HEIGHT - CALENDAR_WEEKDAYS_HEIGHT) / 6;
export const CALENDAR_DAY_INSET = 3;

type ScheduleHeaderLabelOptions = {
  startDateValue?: string;
  endDateValue?: string;
  startTimeValue?: string;
  endTimeValue?: string;
};

const COLLAPSED_SCHEDULE_LABEL = 'Выбрать дату';

/** Собирает `Date` из календарной даты `DD.MM.YYYY` и опционального времени `HH:mm`. */
const buildDateFromCalendarInput = (dateValue: string, timeValue?: string) => {
  const date = parseDateInput(dateValue);

  if (!date) {
    return null;
  }

  if (!timeValue) {
    return date;
  }

  const time = parseTimeParts(timeValue);

  if (!time) {
    return date;
  }

  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes, 0, 0);

  return Number.isNaN(next.getTime()) ? null : next;
};
const formatCalendarDateLabel = (date: Date) =>
  date.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'short',
  });

const formatCalendarTimeLabel = (date: Date) => formatTimeOnly(date.toISOString());

/** Строит короткий label для свернутого календаря на основе строковых значений инпутов. */
export const buildScheduleHeaderLabelFromInputs = ({
  startDateValue,
  endDateValue,
  startTimeValue,
  endTimeValue,
}: ScheduleHeaderLabelOptions) => {
  const startValue = (startDateValue ?? '').trim();
  const endValue = (endDateValue ?? '').trim();

  if (!startValue && !endValue) {
    return COLLAPSED_SCHEDULE_LABEL;
  }

  const hasAnyTime = Boolean((startTimeValue ?? '').trim() || (endTimeValue ?? '').trim());
  const startDate = startValue || endValue;
  const endDate = endValue;
  const startDateObj = buildDateFromCalendarInput(startDate, hasAnyTime ? startTimeValue : undefined);

  if (!startDateObj) {
    return COLLAPSED_SCHEDULE_LABEL;
  }

  const endDateObj = endDate
    ? buildDateFromCalendarInput(endDate, hasAnyTime ? endTimeValue : undefined)
    : null;
  const startDateLabel = formatCalendarDateLabel(startDateObj);
  const startTimeLabel = hasAnyTime
    ? startTimeValue && startTimeValue.trim()
      ? formatCalendarTimeLabel(startDateObj)
      : '??:??'
    : '';

  if (!endDateObj) {
    return hasAnyTime ? `${startDateLabel} – ${startTimeLabel}` : startDateLabel;
  }

  const endDateLabel = formatCalendarDateLabel(endDateObj);
  const endTimeLabel = hasAnyTime
    ? endTimeValue && endTimeValue.trim()
      ? formatCalendarTimeLabel(endDateObj)
      : '??:??'
    : '';
  const sameDate = formatDateInputFromDateType(startDateObj) === formatDateInputFromDateType(endDateObj);

  if (!hasAnyTime) {
    return sameDate ? startDateLabel : `${startDateLabel} – ${endDateLabel}`;
  }

  if (sameDate) {
    return `${startDateLabel}, ${startTimeLabel} – ${endTimeLabel}`;
  }

  return `${startDateLabel}, ${startTimeLabel} – ${endDateLabel}, ${endTimeLabel}`;
};

/** Строит label для свернутого календаря на основе объектов `Date`. */
export const buildScheduleHeaderLabelFromDates = (startDate?: Date, endDate?: Date) => {
  return buildScheduleHeaderLabelFromInputs({
    startDateValue: startDate ? formatDateInputFromDateType(startDate) : '',
    endDateValue: endDate ? formatDateInputFromDateType(endDate) : '',
  });
};

/** Нормализует диапазон дат так, чтобы `start` всегда был не позже `end`. */
export const normalizeCalendarRange = (startKey?: string, endKey?: string) => {
  if (!startKey || !endKey) {
    return { start: startKey, end: endKey };
  }

  const startDate = parseDateInput(startKey);
  const endDate = parseDateInput(endKey);

  if (!startDate || !endDate) {
    return { start: startKey, end: endKey };
  }

  return startDate.getTime() <= endDate.getTime()
    ? { start: startKey, end: endKey }
    : { start: endKey, end: startKey };
};

/** Возвращает количество календарных недель, нужных для отображения месяца в сетке. */
export const getWeeksInMonth = (
  year: number,
  month: number,
  firstDayOfWeek: number
) => {
  const baseDate = dayjs(new Date(year, month, 1));
  const offset = baseDate.date(1 - firstDayOfWeek).day() % 7;
  const daysInMonth = baseDate.daysInMonth();
  return Math.ceil((offset + daysInMonth) / 7);
};

/** Возвращает локализованный заголовок месяца вида `Апрель 2026`. */
export const getCalendarLabel = (year: number, month: number) => {
  const label = dayjs(new Date(year, month, 1))
    .locale('ru')
    .format('MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Подстраивает стили пикера под фиксированную высоту строк и круглые диапазоны выбора. */
export const buildCalendarStyles = (
  baseStyles: Record<string, unknown>,
  weeksInMonth: number
) => {
  const daySize = CALENDAR_DAY_ROW_HEIGHT - CALENDAR_DAY_INSET * 2;
  const dayRadius = daySize / 2;

  return {
    ...baseStyles,
    day_cell: { ...(baseStyles.day_cell as object), height: CALENDAR_DAY_ROW_HEIGHT },
    days: {
      ...(baseStyles.days as object),
      height: CALENDAR_DAY_ROW_HEIGHT * weeksInMonth,
    },
    day: {
      ...(baseStyles.day as object),
      flex: 0,
      height: daySize,
      aspectRatio: 1,
      borderRadius: dayRadius,
      alignSelf: 'center' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    selected: { ...(baseStyles.selected as object), borderRadius: dayRadius },
    range_start: { ...(baseStyles.range_start as object), borderRadius: dayRadius },
    range_end: { ...(baseStyles.range_end as object), borderRadius: dayRadius },
    range_fill: {
      ...(baseStyles.range_fill as object),
      top: CALENDAR_DAY_INSET,
      bottom: CALENDAR_DAY_INSET,
    },
    month_selector_label: {
      ...(baseStyles.month_selector_label as object),
      textTransform: 'capitalize' as const,
    },
    month_label: {
      ...(baseStyles.month_label as object),
      textTransform: 'capitalize' as const,
    },
  };
};



