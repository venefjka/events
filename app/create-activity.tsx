import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { ActivityBasicsStep } from '@/components/steps/activity/ActivityBasicsStep';
import { ActivityLocationStep } from '@/components/steps/activity/ActivityLocationStep';
import { ActivityDetailsStep } from '@/components/steps/activity/ActivityDetailsStep';
import { ActivityScheduleStep } from '@/components/steps/activity/ActivityScheduleStep';
import { ActivityPreferencesStep } from '@/components/steps/activity/ActivityPreferencesStep';
import { ActivityPreviewStep } from '@/components/steps/activity/ActivityPreviewStep';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useAuth } from '@/contexts/AuthContext';
import { categories } from '@/constants/categories';
import {
  getEndDateError,
  getEndTimeError,
  getEventDateError,
  getEventDateTimeError,
  getRepeatEndDateError,
  getStartTimeError,
  getTimeRangeError,
} from '@/utils/validation';
import { buildDateTimeWithTimeZone } from '@/utils/date';
import { getDefaultUtcOffsetOption, getDeviceTimeZone, getTimeZoneFromLocation } from '@/utils/timezone';

export default function CreateActivityScreen() {
  const { createActivity, createActivities } = useActivities();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const defaultTimeZoneOption = getDefaultUtcOffsetOption();

  const initialData = {
    categoryId: '',
    subcategoryId: '',
    title: '',
    description: '',
    photoUrl: undefined as string | undefined,
    photoUrls: [] as string[],
    address: '',
    format: 'offline' as 'offline' | 'online',
    status: 'active' as 'active' | 'cancelled',
    location: {
      latitude: currentUser.cityPlace.latitude,
      longitude: currentUser.cityPlace.longitude,
      settlement: currentUser.cityPlace.settlement,
    },
    timeZone: defaultTimeZoneOption.id,
    timeZoneLabel: defaultTimeZoneOption.label,
    timeZoneVerified: true,
    startDate: '',
    endDate: '',
    endRepeatDate: '',
    startTime: '',
    endTime: '',
    duration: 'oneDay' as 'oneDay' | 'period',
    isRepeating: 'no',
    repeat: 'weekly' as 'weekly' | 'every2weeks' | 'monthly',
    maxParticipants: '',
    maxParticipantsAny: true,
    preferredGender: 'any' as 'any' | 'male' | 'female' | 'mixed',
    preferredAge: '',
    preferredAgeFrom: '',
    preferredAgeTo: '',
    preferredAgeAny: true,
    level: 'any' as 'any' | 'beginner' | 'intermediate' | 'advanced',
    requiresApproval: false,
    isFree: true,
    price: 0,
  };

  const buildNextDate = (date: Date, repeat: string) => {
    const next = new Date(date);
    if (repeat === 'weekly') {
      next.setDate(next.getDate() + 7);
      return next;
    }
    if (repeat === 'every2weeks') {
      next.setDate(next.getDate() + 14);
      return next;
    }
    if (repeat === 'monthly') {
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, lastDay));
      return next;
    }
    next.setDate(next.getDate() + 7);
    return next;
  };

  const buildScheduleDates = (startDate: Date, endDate: Date, repeat: string) => {
    const result: Date[] = [];
    let cursor = new Date(startDate);
    while (cursor <= endDate) {
      result.push(new Date(cursor));
      cursor = buildNextDate(cursor, repeat);
    }
    return result;
  };

  const handleSubmit = (data: any) => {
    const category = categories.find((cat) => cat.id === data.categoryId);
    if (!category) {
      Alert.alert('Missing data', 'Choose a category before creating the activity.');
      return;
    }

    const subcategory = category.subcategories.find((sub) => sub.id === data.subcategoryId);
    const locationTimeZone = data.format === 'online'
      ? undefined
      : getTimeZoneFromLocation(data.location?.latitude, data.location?.longitude);
    const timeZone = data.format === 'online'
      ? data.timeZone ?? getDeviceTimeZone() ?? 'UTC'
      : locationTimeZone ?? getDeviceTimeZone() ?? 'UTC';
    const startDateTime = buildDateTimeWithTimeZone(data.startDate, data.startTime, timeZone);
    const endDateTime = buildDateTimeWithTimeZone(data.endDate, data.endTime, timeZone);
    if (!startDateTime || !endDateTime) {
      Alert.alert('Error', 'Invalid date or time.');
      return;
    }

    const location = data.format === 'online'
      ? {
        latitude: 0,
        longitude: 0,
        address: 'Online',
      }
      : {
        latitude: data.location?.latitude ?? 0,
        longitude: data.location?.longitude ?? 0,
        address: data.address || 'Address not set',
        settlement: data.location?.settlement || currentUser?.cityPlace?.settlement,
      };

    const ageFrom = data.preferredAgeAny ? undefined : Number(data.preferredAgeFrom) || undefined;
    const ageTo = data.preferredAgeAny ? undefined : Number(data.preferredAgeTo) || undefined;

    const maxParticipantsValue = data.maxParticipantsAny
      ? 0
      : Math.max(2, Number(data.maxParticipants) || 2);

    const normalizedGender = data.preferredGender === 'any' ? undefined : data.preferredGender;
    const normalizedLevel = data.level === 'any' ? undefined : data.level;

    const basePayload = {
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      categoryId: category.id,
      subcategoryId: subcategory?.id,
      format: data.format,
      status: data.status,
      location,
      timeZone,
      preferences: {
        gender: normalizedGender,
        ageFrom,
        ageTo,
        level: normalizedLevel,
        maxParticipants: maxParticipantsValue,
      },
      requiresApproval: Boolean(data.requiresApproval),
      photoUrls: data.photoUrls?.length ? data.photoUrls : data.photoUrl ? [data.photoUrl] : undefined,
      price: data.isFree ? 0 : Number(data.price) || 0,
    };

    const shouldRepeat = data.isRepeating === 'yes' && data.endRepeatDate?.trim();
    const repeatEndDateTime = shouldRepeat
      ? buildDateTimeWithTimeZone(data.endRepeatDate, data.startTime, timeZone)
      : null;
    const scheduleDates = shouldRepeat
      ? buildScheduleDates(
        startDateTime,
        repeatEndDateTime ?? startDateTime,
        data.repeat
      )
      : [startDateTime];

    const durationMs = Math.max(0, endDateTime.getTime() - startDateTime.getTime());

    const payloads = scheduleDates.map((date) => {
      const start = new Date(date);
      start.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);
      const end = new Date(start.getTime() + durationMs);
      return {
        ...basePayload,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      };
    });

    const createdActivities = payloads.length > 1
      ? createActivities(payloads)
      : payloads.length === 1
        ? [createActivity(payloads[0])].filter(Boolean)
        : [];

    if (createdActivities.length) {
      router.back();
    } else {
      Alert.alert('Error', 'Sign in to create an activity.');
    }
  };

  const steps = [
    {
      id: 'basics',
      title: 'Что будем делать?',
      desc: 'Выберите категорию деятельности, чтобы пользователям было легче найти Ваше событие',
      component: (props: any) => <ActivityBasicsStep {...props} categories={categories} />,
      isComplete: (data: any) => Boolean(data.categoryId && data.subcategoryId && data.title?.trim()),
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        if (data.title?.length < 3) {
          errors.title = 'Название должно содержать минимум 3 символа';
        }
        return errors;
      },
    },
    {
      id: 'details',
      title: 'А подробнее?',
      desc: 'Расскажите об условиях участия и добавьте фото, чтобы сформировать представление',
      component: ActivityDetailsStep,
      isComplete: (data: any) => Boolean(data.timeZone && data.timeZoneVerified),
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        if (!data.isFree && (!Number(data.price))) {
          errors.price = 'Укажите минимальную стоимость';
        }
        return errors;
      },
    },
    {
      id: 'location',
      title: 'Где?',
      desc: 'Указанная локация будет видна всем, публикуйте точный адрес в чате только для участников',
      component: ActivityLocationStep,
      disableScroll: true,
      shouldShow: (data: any) => data.format !== 'online',
      isComplete: (data: any) => Boolean(data.address?.trim()),
    },
    {
      id: 'schedule',
      title: 'Когда?',
      desc: 'Определите дату и время, соответствующие часовому поясу места проведения',
      component: ActivityScheduleStep,
      isComplete: (data: any) => {
        const hasDates = Boolean(
          data.startDate?.trim() &&
          (data.duration === 'period' ? data.endDate?.trim() : true)
        );
        const hasTimes = Boolean(data.startTime?.trim() && data.endTime?.trim());
        const hasRepeatEnd = data.isRepeating === 'yes' ? Boolean(data.endRepeatDate?.trim()) : true;
        return hasDates && hasTimes && hasRepeatEnd;
      },
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        const startDateError = getEventDateError(data.startDate ?? '');
        const endDateError = data.duration === 'period'
          ? getEndDateError(data.endDate ?? '', data.startDate ?? '')
          : null;
        const startTimeError = getStartTimeError(data.startTime ?? '');
        const endTimeError = getEndTimeError(data.endTime ?? '');
        const dateTimeError = getEventDateTimeError(data.startDate ?? '', data.startTime ?? '');
        const timeRangeError = getTimeRangeError(
          data.startDate ?? '',
          data.startTime ?? '',
          data.endTime ?? '',
          data.duration === 'period' ? data.endDate ?? '' : undefined
        );

        if (startDateError) {
          errors.startDate = startDateError;
        } else if (dateTimeError) {
          errors.startDate = dateTimeError;
        }
        if (endDateError) {
          errors.endDate = endDateError;
        }
        if (startTimeError) {
          errors.startTime = startTimeError;
        }
        if (endTimeError) {
          errors.endTime = endTimeError;
        } else if (timeRangeError) {
          errors.endTime = timeRangeError;
        }

        if (data.isRepeating === 'yes') {
          const endRepeatDateError = getRepeatEndDateError(data.endRepeatDate ?? '', data.startDate ?? '');
          if (endRepeatDateError) {
            errors.endRepeatDate = endRepeatDateError;
          }
        }
        return errors;
      },
    },
    {
      id: 'preferences',
      title: 'Для кого?',
      desc: 'Вы можете указать лимит по количеству участников и определить требования к ним',
      component: (props: any) => <ActivityPreferencesStep {...props} categories={categories} />,
      isComplete: (data: any) => {
        const participantsOk = data.maxParticipantsAny ? true : Number(data.maxParticipants) >= 0;
        return participantsOk
      },
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        if (!data.maxParticipantsAny && (!Number(data.maxParticipants) || Number(data.maxParticipants) < 2)) {
          errors.maxParticipants = 'Задайте максимальное число участников не менее двух персон, включая Вас';
        }
        if (!data.preferredAgeAny) {
          const from = Number(data.preferredAgeFrom);
          const to = Number(data.preferredAgeTo);
          if (!from || !to) {
            errors.preferredAge = 'Укажите возрастной диапазон полностью';
          } else if (from > to) {
            errors.preferredAge = 'Минимальный возраст не может быть больше максимального';
          }
        }
        return errors;
      },
    },
    {
      id: 'preview',
      title: 'Предпросмотр',
      desc: 'Так будет выглядеть Ваше событие в ленте, советуем перепроверить ключевые моменты',
      component: (props: any) => (
        <ActivityPreviewStep {...props} categories={categories} currentUser={currentUser} />
      ),
      disableScroll: true,
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onSubmit={handleSubmit}
      submitButtonText="Готово"
      mode="register"
      onCancel={() => router.back()}
      headerTitle="Создание события"
      initialData={initialData}
    />
  );
}
