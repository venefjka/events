import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityFormScreen } from '@/components/activity-form/ActivityFormScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateActivity } from '@/hooks/mutations/useUpdateActivity';
import { useActivityDetails } from '@/hooks/queries/useActivityDetails';
import { activityDetailToFormData, ActivityFormData, buildUpdateActivityPayload } from '@/utils/activity';

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const activityId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const activityQuery = useActivityDetails(activityId);
  const updateActivityMutation = useUpdateActivity();
  const initialData = useMemo(
    () => (activityQuery.data ? activityDetailToFormData(activityQuery.data) : null),
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
      const payload = await buildUpdateActivityPayload(data, currentUser);
      await updateActivityMutation.mutateAsync({ activityId, payload });
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Не удалось сохранить событие.');
    }
  };

  return (
    <ActivityFormScreen
      currentUser={currentUser}
      initialData={initialData}
      mode="edit"
      onSubmit={handleSubmit}
    />
  );
}
