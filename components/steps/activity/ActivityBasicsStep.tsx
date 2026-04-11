import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { FormField } from '@/components/forms/FormField';
import { DropdownChipSelector } from '@/components/forms/DropdownChipSelector';
import { ActivityCategory } from '@/types';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';

interface ActivityBasicsStepProps {
  data: any;
  updateData: (data: any) => void;
  categories: ActivityCategory[];
  errors?: Record<string, string>;
  showErrors?: boolean;
  setScrollEnabled?: (enabled: boolean) => void;
}

export const ActivityBasicsStep: React.FC<ActivityBasicsStepProps> = ({
  data,
  updateData,
  categories,
  errors,
  showErrors,
}) => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const minCategoryDropdownWidth = Math.max(0, windowWidth - theme.spacing.screenPaddingHorizontal * 2);

  const categoryError = showErrors ? errors?.categoryId : undefined;
  const subcategoryError = showErrors ? errors?.subcategoryId : undefined;
  const titleError = showErrors ? errors?.title : undefined;

  const selectedCategoryId = data.categoryId ?? '';
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  return (
    <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>
      <View style={{ gap: theme.spacing.md }}>
        <FormField
          label="Название"
          value={data.title || ''}
          onChangeText={(text) => updateData({ title: text })}
          placeholder="Бег вдоль набережной"
          error={titleError}
          autoCapitalize="sentences"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          maxLength={40}
        />

        <FormField
          label="Описание"
          value={data.description || ''}
          onChangeText={(text) => updateData({ description: text })}
          placeholder="Групповая тренировка на открытом воздухе в хорошей компании"
          multiline
          numberOfLines={8}
          autoCapitalize="sentences"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ paddingBottom: theme.spacing.lg, width: !selectedCategory ? '100%' : '25%' }}>
            <DropdownChipSelector
              label="Категория"
              value={selectedCategoryId}
              items={categories.map((category) => ({
                id: category.id,
                label: category.name,
                icon: renderCategoryIcon(category, theme.spacing.iconSize),
              }))}
              onSelect={(categoryId) => updateData({ categoryId, subcategoryId: '' })}
              allowClear={false}
              minDropdownWidth={minCategoryDropdownWidth}
              dropdownPlacement='above'
              hideSelectedLabelInChip
            />
            {!!categoryError && <Text style={{ color: theme.colors.error }}>{categoryError}</Text>}
          </View>

          {selectedCategory && (
            <View style={{ paddingBottom: theme.spacing.lg, width: '70%' }}>
              <DropdownChipSelector
                label="Подкатегория"
                value={data.subcategoryId}
                items={subcategories.map((sub) => ({
                  id: sub.id,
                  label: sub.name,
                }))}
                onSelect={(subcategoryId) => updateData({ subcategoryId })}
                allowClear={false}
                dropdownPlacement='above'
              />
              {!!subcategoryError && <Text style={{ color: theme.colors.error }}>{subcategoryError}</Text>}
            </ View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
