import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { InterestSelector } from '../../forms/InterestSelector';
import { categories } from '@/constants/categories';

interface InterestsStepProps {
  data: any;
  updateData: (data: any) => void;
  mode?: 'register' | 'edit';
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export const InterestsStep: React.FC<InterestsStepProps> = ({ data, updateData, mode, errors, showErrors }) => {
  const theme = useTheme();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const interestsError = showErrors ? errors?.interests : undefined;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleInterest = (interestId: string) => {
    const currentInterests = data.interests || [];
    const newInterests = currentInterests.includes(interestId)
      ? currentInterests.filter((id: string) => id !== interestId)
      : [...currentInterests, interestId];
    
    updateData({ interests: newInterests });
  };

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing.screenPaddingHorizontal }]}>
      <View style={styles.selectorContainer}>
        <InterestSelector
          categories={categories}
          selectedInterests={data.interests || []}
          onInterestToggle={toggleInterest}
          expandedCategories={expandedCategories}
          onCategoryToggle={toggleCategory}
        />
        {!!interestsError && <Text style={{ color: theme.colors.error, marginTop: theme.spacing.sm }}>{interestsError}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorContainer: {
    flex: 1,
  },
});
