import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { AccountStep } from '@/components/steps/user-info/AccountStep';
import { PersonalDataStep } from '@/components/steps/user-info/PersonalDataStep';
import { InterestsStep } from '@/components/steps/user-info/InterestsStep';
import {
  getBirthDateError,
  getConfirmPasswordError,
  getEmailError,
  getNameError,
  getPasswordError,
  toIsoBirthDate,
} from '@/utils/validation';
import { useRegisterMutation } from '@/hooks/mutations/useAuthMutations';

export default function RegisterScreen() {
  const registerMutation = useRegisterMutation();

  const handleSubmit = async (data: any) => {
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        birthDate: toIsoBirthDate(data.birthDate),
        city: data.cityPlace,
        gender: data.gender ?? 'notgiven',
        interests: data.interests || [],
        showBirthDate: Boolean(data.birthDatePublic),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось завершить регистрацию';
      Alert.alert('Ошибка', message);
    }
  };

  const steps = [
    {
      id: 'account',
      title: 'Создание учетной записи',
      desc: 'Введите данные для регистрации',
      component: AccountStep,
      isComplete: (data: any) => {
        return Boolean(
          data.email?.trim() &&
          data.password?.trim() &&
          data.confirmPassword?.trim()
        );
      },
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        const emailError = getEmailError(data.email ?? '');
        const passwordError = getPasswordError(data.password ?? '', {
          email: data.email,
          name: data.name,
        });
        const confirmPasswordError = getConfirmPasswordError(data.password ?? '', data.confirmPassword ?? '');

        if (emailError) {
          errors.email = emailError;
        }
        if (passwordError) {
          errors.password = passwordError;
        }
        if (confirmPasswordError) {
          errors.confirmPassword = confirmPasswordError;
        }

        return errors;
      },
    },
    {
      id: 'profile',
      title: 'Расскажите о себе',
      desc: 'Эта информация поможет другим пользователям узнать Вас лучше',
      component: PersonalDataStep,
      isComplete: (data: any) => {
        return Boolean(
          data.name?.trim() &&
          data.birthDate?.trim() &&
          data.cityText?.trim() &&
          data.cityVerified
        );
      },
      validation: (data: any) => {
        const errors: Record<string, string> = {};
        const nameError = getNameError(data.name ?? '');
        const birthDateError = getBirthDateError(data.birthDate ?? '');

        if (nameError) {
          errors.name = nameError;
        }
        if (birthDateError) {
          errors.birthDate = birthDateError;
        }
        if (!data.cityText?.trim()) {
          errors.city = 'Укажите город';
        } else if (!data.cityVerified) {
          errors.city = 'Подтвердите город';
        }

        return errors;
      },
    },
    {
      id: 'interests',
      title: 'Что Вам интересно?',
      desc: 'Выберите категории и подкатегории, чтобы мы могли рекомендовать вам подходящие события',
      component: InterestsStep,
      isComplete: (data: any) => {
        return (data.interests?.length || 0) > 0;
      },
      validation: (data: any) => {
        const errors: Record<string, string> = {};

        if ((data.interests?.length || 0) === 0) {
          errors.interests = 'Выберите хотя бы одну категорию';
        }

        return errors;
      },
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onSubmit={handleSubmit}
      submitButtonText="Завершить регистрацию"
      mode="register"
      onCancel={() => router.back()}
      headerTitle="Регистрация"
    />
  );
}
