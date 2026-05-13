import React from 'react';
import { Text, View } from 'react-native';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { DropdownInputSelector } from '@/components/forms/DropdownInputSelector';
import { getFormatItems } from '@/constants/activityPreferenceOptions';
import { useTheme } from '@/themes/useTheme';
import type { FilterSectionProps } from '../types';

export function FormatFilterSection({ controller }: FilterSectionProps) {
  const theme = useTheme();
  const isOffline = controller.localFilters.format === 'offline';

  return (
    <View style={{ gap: theme.spacing.xxl }}>
      <View>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Формат проведения
        </Text>
        <ExpandableTabBar<'online' | 'offline'>
          items={getFormatItems()}
          activeId={controller.localFilters.format}
          onChange={controller.handleFormatChange}
          circleSize={theme.spacing.iconButtonHeight}
          iconSize={theme.spacing.iconSizeMedium}
          pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
          activePillWidth={0.6}
        />
      </View>

      {isOffline && (
        <DropdownInputSelector
          label="Город"
          value={controller.localFilters.cityQuery ?? ''}
          onChangeText={controller.handleCityQueryChange}
          placeholder="Москва"
          autoCapitalize="words"
          suggestions={controller.citySuggestions.map((place) => ({
            id: String(place.placeId),
            label: place.title,
          }))}
          onSelect={(item) => {
            const selected = controller.citySuggestions.find((place) => String(place.placeId) === item.id);
            if (selected) {
              controller.handleSelectCity(selected);
            }
          }}
          onBlur={() => {
            if (!controller.isCityConfirmed) {
              void controller.searchCities(controller.localFilters.cityQuery ?? '');
            }
          }}
          onFocus={() => controller.resetUiState(controller.isCityConfirmed)}
          onDropdownClose={controller.validateCitySelection}
          openOnBlurSuggestions
          maxDropdownHeight={200}
          error={controller.cityError}
        />
      )}
    </View>
  );
}
