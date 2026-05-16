import React, { useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ActivityFormScreen } from '@/components/activity-form/ActivityFormScreen';
import { createActivityInitialData } from '@/utils/activity';
import { buildCreateActivityPayloads } from '@/utils/activity';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateActivity } from '@/hooks/mutations/useCreateActivity';
import type { ActivityFormData } from '@/utils/activity';

export default function CreateActivityScreen() {
  const { currentUser } = useAuth();
  const createActivityMutation = useCreateActivity();
  const initialData = useMemo(
    () => (currentUser ? createActivityInitialData(currentUser) : null),
    [currentUser]
  );

  if (!currentUser || !initialData) return null;

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      const payloads = await buildCreateActivityPayloads(data, currentUser);
      await Promise.all(payloads.map((payload) => createActivityMutation.mutateAsync(payload)));
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Не удалось создать событие.');
    }
  };

  return (
    <ActivityFormScreen
      currentUser={currentUser}
      initialData={initialData}
      mode="create"
      onSubmit={handleSubmit}
    />
  );
}
