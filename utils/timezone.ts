import tzLookup from 'tz-lookup';
import { getTimeZoneOffsetMinutes } from '@/utils/date';

export const getDeviceTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return undefined;
  }
};

export const getTimeZoneFromLocation = (latitude?: number, longitude?: number): string | undefined => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return undefined;
  try {
    return tzLookup(latitude, longitude);
  } catch (error) {
    return undefined;
  }
};

export type UtcOffsetOption = {
  id: string;
  label: string;
  offsetMinutes: number;
  offsetHours: number;
};

const buildUtcOffsetLabel = (offsetMinutes: number) => {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const buildEtcGmtTimeZone = (offsetHours: number) => {
  if (offsetHours === 0) return 'Etc/UTC';
  const sign = offsetHours >= 0 ? '-' : '+';
  return `Etc/GMT${sign}${Math.abs(offsetHours)}`;
};

const HOUR_OFFSET_OPTIONS: UtcOffsetOption[] = Array.from({ length: 27 }, (_, index) => {
  const offsetHours = index - 12;
  const offsetMinutes = offsetHours * 60;
  return {
    offsetHours,
    offsetMinutes,
    id: buildEtcGmtTimeZone(offsetHours),
    label: buildUtcOffsetLabel(offsetMinutes),
  };
});

const MINUTE_OFFSET_BASE: Array<{ id: string; offsetMinutes: number }> = [
  { id: 'Pacific/Marquesas', offsetMinutes: -570 }, // UTC-09:30
  { id: 'America/St_Johns', offsetMinutes: -210 }, // UTC-03:30 (DST changes to -02:30)
  { id: 'Asia/Kabul', offsetMinutes: 270 }, // UTC+04:30
  { id: 'Asia/Kolkata', offsetMinutes: 330 }, // UTC+05:30
  { id: 'Asia/Kathmandu', offsetMinutes: 345 }, // UTC+05:45
  { id: 'Asia/Yangon', offsetMinutes: 390 }, // UTC+06:30
  { id: 'Australia/Eucla', offsetMinutes: 525 }, // UTC+08:45
  { id: 'Australia/Darwin', offsetMinutes: 570 }, // UTC+09:30
  { id: 'Australia/Lord_Howe', offsetMinutes: 630 }, // UTC+10:30 (DST changes to +11:00)
  { id: 'Pacific/Chatham', offsetMinutes: 765 }, // UTC+12:45 (DST changes to +13:45)
];

const MINUTE_OFFSET_OPTIONS: UtcOffsetOption[] = MINUTE_OFFSET_BASE.map((option) => ({
  ...option,
  offsetHours: option.offsetMinutes / 60,
  label: buildUtcOffsetLabel(option.offsetMinutes),
}));

const UTC_OFFSET_OPTIONS: UtcOffsetOption[] = [...HOUR_OFFSET_OPTIONS, ...MINUTE_OFFSET_OPTIONS].sort(
  (a, b) => a.offsetMinutes - b.offsetMinutes
);

export const getUtcOffsetOptions = (): UtcOffsetOption[] => UTC_OFFSET_OPTIONS;

export const getUtcOffsetOptionByTimeZone = (
  timeZone: string,
  date: Date = new Date()
): UtcOffsetOption | undefined => {
  try {
    const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
    const roundedMinutes = Math.round(offsetMinutes);
    return UTC_OFFSET_OPTIONS.find((option) => option.offsetMinutes === roundedMinutes);
  } catch (error) {
    return undefined;
  }
};

export const getDefaultUtcOffsetOption = (): UtcOffsetOption => {
  const deviceTimeZone = getDeviceTimeZone();
  if (deviceTimeZone) {
    const option = getUtcOffsetOptionByTimeZone(deviceTimeZone);
    if (option) return option;
  }
  return UTC_OFFSET_OPTIONS.find((option) => option.offsetHours === 0)!;
};
