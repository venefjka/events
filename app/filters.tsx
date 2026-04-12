import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useActivityFilters, type ActivityFilterScope } from '@/contexts/ActivityFiltersContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { useTheme } from '@/themes/useTheme';
import {
  CategoryFilterSection,
  createDefaultFilters,
  createFilterDraft,
  FormatFilterSection,
  getFilterProfileContext,
  ParticipationFilterSection,
  PreferencesFilterSection,
  ScheduleFilterSection,
  useFiltersFormController,
} from '@/components/filters';

export default function FiltersScreen() {
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const resolvedScope = useMemo<ActivityFilterScope>(() => {
    return scope === 'my-activities' ? 'my-activities' : 'explore';
  }, [scope]);
  const { filters, setFilters } = useActivityFilters(resolvedScope);
  const profile = useMemo(() => getFilterProfileContext(currentUser), [currentUser]);
  const [localFilters, setLocalFilters] = useState(() => createFilterDraft(filters, profile));
  const controller = useFiltersFormController({
    localFilters,
    setLocalFilters,
    profile,
  });

  useEffect(() => {
    setLocalFilters(createFilterDraft(filters, profile));
  }, [filters, profile]);

  const sectionStyle = {
    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
    paddingVertical: theme.spacing.xxl,
  };

  const dividerStyle = {
    height: theme.spacing.sectionDivider,
    backgroundColor: theme.colors.surfaceVariant,
  };

  const handleApply = () => {
    if (!controller.validateCitySelection()) {
      return;
    }
    setFilters(localFilters);
    router.back();
  };

  const handleReset = () => {
    const resetFilters = createDefaultFilters(profile);
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    controller.resetUiState(Boolean(profile.profileSelectedCity));
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <Header title="Фильтры" showBackButton borderBottom={false} />
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={-70}
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={sectionStyle}>
          <CategoryFilterSection controller={controller} />
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <FormatFilterSection controller={controller} />
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <ScheduleFilterSection controller={controller} />
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <ParticipationFilterSection controller={controller} />
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <PreferencesFilterSection controller={controller} />
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.colors.border,
            borderTopWidth: theme.spacing.borderWidth,
            backgroundColor: theme.colors.background,
            padding: theme.spacing.screenPaddingVertical,
            gap: theme.spacing.md,
          },
        ]}
      >
        <Button
          title="Сбросить"
          variant="secondary"
          onPress={handleReset}
          style={{ width: '35%', borderWidth: 0 }}
        />
        <Button
          title="Применить"
          variant="primary"
          onPress={handleApply}
          style={{ width: '62%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
