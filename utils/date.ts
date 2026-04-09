import dayjs from 'dayjs';
import type { DateType } from 'react-native-ui-datepicker';

/**
 * Утилиты для работы с датами
 */

/**
 * Форматирует дату для отображения в списке активностей
 */
export const formatActivityDate = (dateString: string, timeZone?: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }
  return new Date(dateString).toLocaleString('ru', options);
};

/**
 * Разбирает строку `DD.MM.YYYY` в числовые части даты.
 */
const parseDateParts = (value: string): { year: number; month: number; day: number } | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;
  return { year, month, day };
};

/**
 * Разбирает строку времени `HH:mm` в часы и минуты.
 */
export const parseTimeParts = (value?: string): { hours: number; minutes: number } | null => {
  const trimmed = (value ?? '').trim();
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
};

/**
 * Парсит строку `DD.MM.YYYY` в объект `Date`. 
 */
export const parseDateInput = (value: string): Date | undefined => {
  const parts = parseDateParts(value);
  if (!parts) return undefined;
  const { day, month, year } = parts;
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
};

/**
 * Возвращает начало дня `00:00:00.000`.
 */
export const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Возвращает конец дня `23:59:59.999`. 
 */
export const toEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/**
 * Форматирует `Date`/`DateType` в строку `DD.MM.YYYY`.
 */
export const formatDateInputFromDateType = (value?: DateType): string => {
  if (!value) return '';
  const date = dayjs.isDayjs(value)
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
};

/**
 * Возвращает смещение таймзоны в минутах для конкретной даты.
 */
export const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUtc - date.getTime()) / 60000;
};

const FIXED_TIMEZONE_OFFSETS: Record<string, number> = {
  'Pacific/Marquesas': -570, // UTC-09:30
  'America/St_Johns': -210, // UTC-03:30
  'Asia/Kabul': 270, // UTC+04:30
  'Asia/Kolkata': 330, // UTC+05:30
  'Asia/Kathmandu': 345, // UTC+05:45
  'Asia/Yangon': 390, // UTC+06:30
  'Australia/Eucla': 525, // UTC+08:45
  'Australia/Darwin': 570, // UTC+09:30
  'Australia/Lord_Howe': 630, // UTC+10:30
  'Pacific/Chatham': 765, // UTC+12:45
};

/**
 * Собирает `Date` из локальных даты/времени с учётом указанной таймзоны.
 */
export const buildDateTimeWithTimeZone = (
  dateValue: string,
  timeValue: string,
  timeZone?: string
): Date | null => {
  const date = parseDateParts(dateValue);
  const time = parseTimeParts(timeValue);
  if (!date || !time) return null;

  if (!timeZone) {
    return new Date(date.year, date.month - 1, date.day, time.hours, time.minutes, 0, 0);
  }

  const utcGuess = new Date(Date.UTC(date.year, date.month - 1, date.day, time.hours, time.minutes, 0, 0));
  let offset = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  let adjusted = new Date(utcGuess.getTime() - offset * 60000);
  offset = getTimeZoneOffsetMinutes(adjusted, timeZone);
  adjusted = new Date(utcGuess.getTime() - offset * 60000);
  return adjusted;
};

/**
 * Форматирует смещение таймзоны в вид `UTC+3` или `UTC+5:30`.
 */
export const formatTimeZoneOffset = (dateString: string, timeZone?: string): string | undefined => {
  if (!timeZone) return undefined;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;
  const fixedOffset = FIXED_TIMEZONE_OFFSETS[timeZone];
  const offsetMinutes = Math.round(
    fixedOffset !== undefined ? fixedOffset : getTimeZoneOffsetMinutes(date, timeZone)
  );
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Форматирует только дату в коротком виде, опционально в указанной таймзоне.
 */
export const formatDateOnly = (dateString: string, timeZone?: string): string => {
  return new Date(dateString).toLocaleDateString('ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  });
};

/**
 * Форматирует только время, опционально в указанной таймзоне.
 */
export const formatTimeOnly = (dateString: string, timeZone?: string): string => {
  return new Date(dateString).toLocaleTimeString('ru', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Проверяет, является ли дата завтрашней
 */
export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * Проверяет, является ли дата прошедшей
 */
export const isPast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Проверяет, является ли дата выходным днем
 */
export const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * Получает количество часов до события
 */
export const getHoursUntilEvent = (dateString: string): number => {
  const eventTime = new Date(dateString);
  const now = new Date();
  const diffMs = eventTime.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Получает относительное время (например, "через 2 часа", "через 3 дня")
 */
export const getRelativeTime = (dateString: string): string => {
  const hours = getHoursUntilEvent(dateString);
  
  if (hours < 0) {
    return 'Прошло';
  }
  
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `через ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}`;
  }
  
  if (hours < 24) {
    const h = Math.floor(hours);
    return `через ${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`;
  }
  
  const days = Math.floor(hours / 24);
  return `через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
};



