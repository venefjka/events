import React from 'react';
import { View } from 'react-native';
import { categories } from '@/constants/categories';
import { DropdownChipSelector } from '@/components/forms/DropdownChipSelector';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { useTheme } from '@/themes/useTheme';
import type { FilterSectionProps } from '../types';

export function CategoryFilterSection({ controller }: FilterSectionProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: !controller.selectedCategory ? '100%' : '25%' }}>
          <DropdownChipSelector
            label="Категория"
            value={controller.selectedCategoryId}
            items={categories.map((category) => ({
              id: category.id,
              label: category.name,
              icon: renderCategoryIcon(category, theme.spacing.iconSize),
            }))}
            onSelect={controller.handleCategorySelect}
            allowClear
            minDropdownWidth={controller.minCategoryDropdownWidth}
            dropdownPlacement="below"
            hideSelectedLabelInChip
          />
        </View>

        {controller.selectedCategory ? (
          <View style={{ width: '70%' }}>
            <DropdownChipSelector
              label="Подкатегория"
              value={controller.localFilters.subcategoryId ?? ''}
              items={controller.subcategories.map((sub) => ({
                id: sub.id,
                label: sub.name,
              }))}
              onSelect={controller.handleSubcategorySelect}
              allowClear
              dropdownPlacement="below"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
