import React from 'react';
import { router } from 'expo-router';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { ActivityBasicsStep } from '@/components/steps/activity/ActivityBasicsStep';
import { ActivityDetailsStep } from '@/components/steps/activity/ActivityDetailsStep';
import { ActivityLocationStep } from '@/components/steps/activity/ActivityLocationStep';
import { ActivityPreferencesStep } from '@/components/steps/activity/ActivityPreferencesStep';
import { ActivityPreviewStep } from '@/components/steps/activity/ActivityPreviewStep';
import { ActivityScheduleStep } from '@/components/steps/activity/ActivityScheduleStep';
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
import type { UserProfileDto } from '@/types/dto';
import type { ActivityFormData } from '@/utils/activity';

type ActivityFormMode = 'create' | 'edit' | 'duplicate';

interface ActivityFormScreenProps {
  currentUser: UserProfileDto;
  initialData: ActivityFormData;
  mode: ActivityFormMode;
  onSubmit: (data: ActivityFormData) => void | Promise<void>;
}

const getHeaderTitle = (mode: ActivityFormMode) => {
  if (mode === 'edit') return 'Редактирование события';
  if (mode === 'duplicate') return 'Создание на основе события';
  return 'Создание события';
};

export function ActivityFormScreen({
  currentUser,
  initialData,
  mode,
  onSubmit,
}: ActivityFormScreenProps) {
  const canPlanRepeats = mode !== 'edit';
  const steps = [
    {
      id: 'basics',
      title: 'Что будем делать?',
      desc: 'Выберите категорию деятельности, чтобы пользователям было легче найти Ваше событие',
      component: (props: any) => <ActivityBasicsStep {...props} categories={categories} />,
      isComplete: (data: ActivityFormData) => Boolean(data.categoryId && data.subcategoryId && data.title?.trim()),
      validation: (data: ActivityFormData) => {
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
      isComplete: (data: ActivityFormData) => Boolean(data.timeZone && data.timeZoneVerified),
      validation: (data: ActivityFormData) => {
        const errors: Record<string, string> = {};
        if (!data.isFree && !Number(data.price)) {
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
      shouldShow: (data: ActivityFormData) => data.format !== 'online',
      isComplete: (data: ActivityFormData) => Boolean(data.address?.trim()),
    },
    {
      id: 'schedule',
      title: 'Когда?',
      desc: 'Определите дату и время, соответствующие часовому поясу места проведения',
      component: ActivityScheduleStep,
      isComplete: (data: ActivityFormData) => {
        const hasDates = Boolean(
          data.startDate?.trim() &&
          (data.duration === 'period' ? data.endDate?.trim() : true)
        );
        const hasTimes = Boolean(data.startTime?.trim() && data.endTime?.trim());
        const hasRepeatEnd = canPlanRepeats && data.isRepeating === 'yes'
          ? Boolean(data.endRepeatDate?.trim())
          : true;
        return hasDates && hasTimes && hasRepeatEnd;
      },
      validation: (data: ActivityFormData) => {
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
        if (canPlanRepeats && data.isRepeating === 'yes') {
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
      isComplete: (data: ActivityFormData) => data.maxParticipantsAny || Number(data.maxParticipants) >= 0,
      validation: (data: ActivityFormData) => {
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
      key={mode === 'edit' ? `edit-activity-${initialData.activityId}` : `${mode}-activity`}
      steps={steps}
      onSubmit={onSubmit}
      submitButtonText={mode === 'edit' ? 'Сохранить изменения' : 'Готово'}
      mode={mode === 'edit' ? 'edit' : 'register'}
      onCancel={() => router.back()}
      headerTitle={getHeaderTitle(mode)}
      initialData={initialData}
    />
  );
}
