import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityFormScreen } from '@/components/activity-form/ActivityFormScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateActivity } from '@/hooks/mutations/useCreateActivity';
import { useActivityDetails } from '@/hooks/queries/useActivityDetails';
import {
  activityDetailToFormData,
  buildCreateActivityPayloads,
  type ActivityFormData,
} from '@/utils/activity';

const toDuplicateInitialData = (data: ActivityFormData): ActivityFormData => ({
  ...data,
  activityId: undefined,
  status: 'active',
  isRepeating: 'no',
  repeat: 'weekly',
  endRepeatDate: '',
});

export default function DuplicateActivityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const activityId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const activityQuery = useActivityDetails(activityId);
  const createActivityMutation = useCreateActivity();
  const initialData = useMemo(
    () => (
      activityQuery.data
        ? toDuplicateInitialData(activityDetailToFormData(activityQuery.data))
        : null
    ),
    [activityQuery.data]
  );

  if (!currentUser) return null;

  if (activityQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Загружаем событие...</Text>
      </View>
    );
  }

  if (!activityId || !initialData) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Не удалось загрузить событие.</Text>
      </View>
    );
  }

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      const payloads = await buildCreateActivityPayloads(data, currentUser);
      await Promise.all(payloads.map((payload) => createActivityMutation.mutateAsync(payload)));
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Не удалось сохранить событие.');
    }
  };

  return (
    <ActivityFormScreen
      currentUser={currentUser}
      initialData={initialData}
      mode="duplicate"
      onSubmit={handleSubmit}
    />
  );
}
