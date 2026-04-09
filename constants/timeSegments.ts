import { TimeSegment } from '@/types';

export const TIME_SEGMENTS: Array<{
  id: TimeSegment | null;
  label: string;
  time?: string;
  highlight?: boolean;
}> = [
  { id: null, label: 'Любое', time: '' },
  { id: 'now', label: 'Сейчас', time: '+2 часа', highlight: true },
  { id: 'morning', label: 'Утро', time: '6:00-12:00' },
  { id: 'afternoon', label: 'День', time: '12:00-17:00' },
  { id: 'evening', label: 'Вечер', time: '17:00-23:00' },
  { id: 'night', label: 'Ночь', time: '23:00-6:00' },
];
