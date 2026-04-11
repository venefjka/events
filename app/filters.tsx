import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useAuth } from '@/contexts/AuthContext';
import { categories } from '@/constants/categories';
import { DropdownInputSelector } from '@/components/forms/DropdownInputSelector';
import { DropdownChipSelector } from '@/components/forms/DropdownChipSelector';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { getUtcOffsetOptions } from '@/utils/timezone';
import { useTheme } from '@/themes/useTheme';
import { ActivityScheduleCalendar } from '@/components/forms/ActivityScheduleCalendar';
import { parseDateInput, formatDateInputFromDateType } from '@/utils/date';
import { formatDateInput, formatTimeInput } from '@/utils/formatInput';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { Asterisk, BanknoteX, Infinity, RussianRuble } from 'lucide-react-native';
import {
  ApprovalFilterOption,
  GenderOption,
  LevelOption,
  getApprovalFilterItems,
  getGenderItems,
  getLevelItems,
  getFormatItems,
  parseMaxParticipantsInput,
} from '@/constants/activityPreferenceOptions';
import { CitySearchResult, verifyCityByNominatim } from '@/utils/verifyCity';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function FiltersScreen() {
  const { filters, setFilters, setSelectedTimeSegment } = useActivities();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const profileCity = currentUser?.cityPlace?.settlement?.trim() ?? '';
  const profileCityTitle = [
    currentUser?.cityPlace?.settlement,
    currentUser?.cityPlace?.region,
    currentUser?.cityPlace?.country,
  ].filter(Boolean).join(', ');
  const profileSelectedCity = currentUser?.cityPlace
    ? {
        ...currentUser.cityPlace,
        title: currentUser.cityPlace.title ?? profileCityTitle,
      }
    : null;
  const [localFilters, setLocalFilters] = useState(() => ({
    ...filters,
    cityQuery:
      filters.format === 'offline' && !filters.selectedCity && !filters.cityQuery?.trim()
        ? profileCityTitle || profileCity
        : filters.cityQuery,
    selectedCity:
      filters.format === 'offline' && !filters.selectedCity
        ? profileSelectedCity
        : filters.selectedCity,
  }));
  const timeZoneOptions = useMemo(() => getUtcOffsetOptions(), []);
  const minTimeZoneValue = String(localFilters.timeZoneRange[0]);
  const maxTimeZoneValue = String(localFilters.timeZoneRange[1]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);

  const [cityError, setCityError] = useState<string | undefined>(undefined);
  const [citySuggestions, setCitySuggestions] = useState<CitySearchResult[]>([]);
  const [isCityConfirmed, setIsCityConfirmed] = useState(
    Boolean(filters.selectedCity || (filters.format === 'offline' && profileSelectedCity))
  );
  const citySearchRequestId = useRef(0);
  const didInitProfileCityRef = useRef(false);

  const selectedCategoryId = localFilters.categoryId ?? '';
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const selectedSubcategory = subcategories.find((sub) => sub.id === localFilters.subcategoryId);
  const hasLevel = selectedSubcategory?.hasLevel ?? selectedCategory?.hasLevel ?? true;
  const minCategoryDropdownWidth = Math.max(
    0,
    windowWidth - theme.spacing.screenPaddingHorizontal * 2
  );

  const genderId: GenderOption = localFilters.gender ?? 'any';
  const levelId: LevelOption = localFilters.level ?? 'any';
  const registrationId: ApprovalFilterOption = localFilters.registrationType ?? 'any';
  const isPriceAny = localFilters.priceTo == null;
  const isMaxParticipantsAny = localFilters.maxParticipants == null;
  const isAgeAny = Boolean(localFilters.ageAny);
  const ageFromValue = localFilters.ageFrom ?? '';
  const ageToValue = localFilters.ageTo ?? '';

  const startDate = useMemo(
    () => parseDateInput(localFilters.dateFrom ?? ''),
    [localFilters.dateFrom]
  );
  const endDate = useMemo(
    () => parseDateInput(localFilters.dateTo ?? ''),
    [localFilters.dateTo]
  );

  const handleStartDateInput = React.useCallback((text: string) => {
    const nextValue = formatDateInput(text);
    setLocalFilters((prev) => {
      const nextStartDate = parseDateInput(nextValue);
      const currentEndDate = parseDateInput(prev.dateTo ?? '');

      if (nextStartDate && currentEndDate && nextStartDate > currentEndDate) {
        return {
          ...prev,
          dateFrom: nextValue,
          dateTo: nextValue,
        };
      }

      return {
        ...prev,
        dateFrom: nextValue,
      };
    });
  }, []);

  const handleEndDateInput = React.useCallback((text: string) => {
    const nextValue = formatDateInput(text);
    setLocalFilters((prev) => {
      const currentStartDate = parseDateInput(prev.dateFrom ?? '');
      const nextEndDate = parseDateInput(nextValue);

      if (currentStartDate && nextEndDate && nextEndDate < currentStartDate) {
        return {
          ...prev,
          dateFrom: nextValue,
          dateTo: nextValue,
        };
      }

      return {
        ...prev,
        dateTo: nextValue,
      };
    });
  }, []);

  const handleStartTimeInput = React.useCallback((text: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      timeFrom: formatTimeInput(text),
    }));
  }, []);

  const handleEndTimeInput = React.useCallback((text: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      timeTo: formatTimeInput(text),
    }));
  }, []);

  const sectionStyle = {
    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.xxl
  }

  const dividerStyle = { height: theme.spacing.sectionDivider, backgroundColor: theme.colors.surfaceVariant };
  const subTitleStyle = {
    ...theme.typography.label, color: theme.colors.text,
    marginBottom: theme.spacing.sm
  };

  const genderItems = useMemo(() => getGenderItems(), []);
  const levelItems = useMemo(() => getLevelItems(), []);
  const approvalItems = useMemo(() => getApprovalFilterItems(), []);
  const formatItems = useMemo(() => getFormatItems(), []);

  useEffect(() => {
    if (didInitProfileCityRef.current || !profileCity) {
      return;
    }

    let didApplyProfileCity = false;

    setLocalFilters((prev) => {
      if (prev.format !== 'offline' || prev.selectedCity || prev.cityQuery?.trim()) {
        return prev;
      }

      didApplyProfileCity = true;

      return {
        ...prev,
        cityQuery: profileCityTitle || profileCity,
        selectedCity: profileSelectedCity,
      };
    });

    if (didApplyProfileCity) {
      setIsCityConfirmed(true);
      setCityError(undefined);
    }

    didInitProfileCityRef.current = true;
  }, [profileCity, profileCityTitle, profileSelectedCity]);
  const searchCities = React.useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    const requestId = ++citySearchRequestId.current;
    if (!normalizedQuery) {
      setCitySuggestions([]);
      setCityError(undefined);
      return;
    }
    if (normalizedQuery.length < 2) {
      setCitySuggestions([]);
      setCityError(undefined);
      return;
    }
    try {
      const places = await verifyCityByNominatim(normalizedQuery);
      if (requestId !== citySearchRequestId.current) {
        return;
      }
      setCitySuggestions(places);
      if (!places.length) {
        setCityError('Не удалось найти населённый пункт, проверьте написание');
        return;
      }
      setCityError(undefined);
    } catch (e) {
      if (requestId !== citySearchRequestId.current) {
        return;
      }
      setCitySuggestions([]);
      setCityError('Ошибка поиска, попробуйте снова');
    }
  }, []);
  const validateCitySelection = React.useCallback(() => {
    if (localFilters.format !== 'offline') {
      setCityError(undefined);
      return true;
    }
    const cityQuery = (localFilters.cityQuery ?? '').trim();
    if (!cityQuery) {
      setCityError('Укажите город для оффлайн-событий');
      return false;
    }
    if (cityQuery.length < 2) {
      setCityError('Введите город (минимум 2 символа)');
      return false;
    }
    if (!isCityConfirmed) {
      setCityError('Выберите город из списка');
      return false;
    }
    setCityError(undefined);
    return true;
  }, [isCityConfirmed, localFilters.cityQuery, localFilters.format]);

  const handleApply = () => {
    if (!validateCitySelection()) {
      return;
    }
    setFilters(localFilters);
    setSelectedTimeSegment(localFilters.timeSegment ?? null);
    router.back();
  };

  const applyAgeRange = React.useCallback(
    (fromValue: string, toValue: string) => {
      const from = fromValue.replace(/\D/g, '').slice(0, 3);
      const to = toValue.replace(/\D/g, '').slice(0, 3);
      const hasRange = Boolean(from || to);
      setLocalFilters((prev) => ({
        ...prev,
        ageAny: !hasRange,
        ageFrom: from ? Number(from) : null,
        ageTo: to ? Number(to) : null,
      }));
    },
    []
  );

  const handleReset = () => {
    const resetFilters = {
      categoryId: '',
      subcategoryId: '',
      priceTo: null,
      cityQuery: '',
      selectedCity: null,
      maxParticipants: null,
      registrationType: 'any' as const,
      onlyAvailable: false,
      level: 'any' as const,
      gender: 'any' as const,
      ageFrom: null,
      ageTo: null,
      ageAny: true,
      timeSegment: null,
      dateFrom: '',
      dateTo: '',
      timeFrom: '',
      timeTo: '',
      timeZoneRange: [-12, 14] as [number, number],
      format: 'offline' as const,
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    setSelectedTimeSegment(null);
    setCitySuggestions([]);
    setCityError(undefined);
    setIsCityConfirmed(Boolean(profileCity));
    router.replace('/');
  };

  const handleSelectCity = (place: CitySearchResult) => {
    setLocalFilters((prev) => ({
      ...prev,
      cityQuery: place.title,
      selectedCity: {
        settlement: place.settlement,
        region: place.region ?? '',
        country: place.country,
        latitude: place.lat,
        longitude: place.lon,
        title: place.title,
      },
    }));
    setIsCityConfirmed(true);
    setCitySuggestions([]);
    setCityError(undefined);
  };

  const isOffline = localFilters.format === 'offline';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <Header
        title="Фильтры"
        showBackButton
        borderBottom={false}
      />
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={-70}
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={sectionStyle}>
          <View style={styles.inlineRow}>
            <View style={{ width: !selectedCategory ? '100%' : '25%' }}>
              <DropdownChipSelector
                label="Категория"
                value={selectedCategoryId}
                items={categories.map((category) => ({
                  id: category.id,
                  label: category.name,
                  icon: renderCategoryIcon(category, theme.spacing.iconSize),
                }))}
                onSelect={(categoryId) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    categoryId,
                    subcategoryId: '',
                  }))
                }
                allowClear
                minDropdownWidth={minCategoryDropdownWidth}
                dropdownPlacement="below"
                hideSelectedLabelInChip
              />
            </View>

            {selectedCategory && (
              <View style={{ width: '70%' }}>
                <DropdownChipSelector
                  label="Подкатегория"
                  value={localFilters.subcategoryId ?? ''}
                  items={subcategories.map((sub) => ({
                    id: sub.id,
                    label: sub.name,
                  }))}
                  onSelect={(subcategoryId) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      subcategoryId,
                    }))
                  }
                  allowClear
                  dropdownPlacement="below"
                />
              </View>
            )}
          </View>
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <View>
            <Text style={subTitleStyle}>Формат проведения</Text>
            <ExpandableTabBar<'online' | 'offline'>
              items={formatItems}
              activeId={localFilters.format}
              onChange={(id) => {
                const nextSelectedCity = id === 'online'
                  ? null
                  : (localFilters.selectedCity ?? profileSelectedCity);
                const nextCityQuery = id === 'online'
                  ? ''
                  : (localFilters.cityQuery?.trim() || nextSelectedCity?.title || profileCityTitle || profileCity);

                setLocalFilters((prev) => ({
                  ...prev,
                  format: id,
                  cityQuery: nextCityQuery,
                  selectedCity: nextSelectedCity,
                }));
                if (id === 'online') {
                  setCityError(undefined);
                  setCitySuggestions([]);
                  setIsCityConfirmed(false);
                } else {
                  setCityError(undefined);
                  setIsCityConfirmed(Boolean(nextSelectedCity));
                }
              }}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.6}
            />
          </View>

          {isOffline ? (
            <>
              <DropdownInputSelector
                label="Город"
                value={localFilters.cityQuery ?? ''}
                onChangeText={(text) => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    cityQuery: text,
                    selectedCity: null,
                  }));
                  setIsCityConfirmed(false);
                  setCitySuggestions([]);
                  setCityError(undefined);
                }}
                placeholder="Москва"
                autoCapitalize="words"
                suggestions={citySuggestions.map((place) => ({
                  id: String(place.placeId),
                  label: place.title,
                }))}
                onSelect={(item) => {
                  const selected = citySuggestions.find((place) => String(place.placeId) === item.id);
                  if (selected) handleSelectCity(selected);
                }}
                onBlur={() => {
                  if (!isCityConfirmed) {
                    searchCities(localFilters.cityQuery ?? '');
                  }
                }}
                onFocus={() => {
                  setCityError(undefined);
                }}
                onDropdownClose={() => {
                  validateCitySelection();
                }}
                openOnBlurSuggestions
                maxDropdownHeight={200}
                error={cityError}
              />
            </>
          ) : (
            <View>
              <Text style={subTitleStyle}>Часовой пояс</Text>
              <View style={styles.inlineRow}>
                <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
                  от
                </Text>
                <View style={{ width: '40%' }}>
                  <DropdownChipSelector
                    label=""
                    value={minTimeZoneValue}
                    items={timeZoneOptions.map((option) => ({
                      id: String(option.offsetHours),
                      label: option.label,
                    }))}
                    onSelect={(id) => {
                      const offset = Number(id);
                      setLocalFilters((prev) => {
                        const [, max] = prev.timeZoneRange;
                        return {
                          ...prev,
                          timeZoneRange: [offset, Math.max(offset, max)],
                        };
                      });
                    }}
                    allowClear={false}
                  />
                </View>

                <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
                  до
                </Text>
                <View style={{ width: '40%' }}>
                  <DropdownChipSelector
                    label=""
                    value={maxTimeZoneValue}
                    items={timeZoneOptions.map((option) => ({
                      id: String(option.offsetHours),
                      label: option.label,
                    }))}
                    onSelect={(id) => {
                      const offset = Number(id);
                      setLocalFilters((prev) => {
                        const [min] = prev.timeZoneRange;
                        return {
                          ...prev,
                          timeZoneRange: [Math.min(min, offset), offset],
                        };
                      });
                    }}
                    allowClear={false}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <View style={{ gap: theme.spacing.lg }}>
            <ActivityScheduleCalendar
              variant="inputs"
              duration="period"
              isOpen={isCalendarOpen}
              onToggle={setIsCalendarOpen}
              startDate={startDate}
              endDate={endDate}
              startDateValue={localFilters.dateFrom ?? ''}
              endDateValue={localFilters.dateTo ?? ''}
              startTimeValue={localFilters.timeFrom ?? ''}
              endTimeValue={localFilters.timeTo ?? ''}
              onStartDateInput={handleStartDateInput}
              onEndDateInput={handleEndDateInput}
              onStartTimeInput={handleStartTimeInput}
              onEndTimeInput={handleEndTimeInput}
              onSingleChange={() => undefined}
              onRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
                const start = formatDateInputFromDateType(nextStart);
                if (!start) {
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateFrom: '',
                    dateTo: '',
                  }));
                  return;
                }
                const end = formatDateInputFromDateType(nextEnd);
                setLocalFilters((prev) => ({
                  ...prev,
                  dateFrom: start,
                  dateTo: end,
                }));
              }}
            />
          </View>
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
        <View>
            <Text style={subTitleStyle}>Стоимость участия до</Text>
            <View style={styles.inlineRow}>
              <FormField
                label=""
                value={!isPriceAny ? String(localFilters.priceTo ?? '') : ''}
                onChangeText={(text) => {
                  const numeric = text.replace(/\D/g, '').slice(0, 6);
                  if (!numeric) {
                    setLocalFilters((prev) => ({ ...prev, priceTo: null }));
                    return;
                  }
                  setLocalFilters((prev) => ({ ...prev, priceTo: parseInt(numeric, 10) || null }));
                }}
                placeholder={'1 000 000'}
                keyboardType="number-pad"
                maxLength={6}
                style={{ width: '80%', marginBottom: 0 }}
                rightIcon={
                  isPriceAny ? undefined : <RussianRuble size={theme.spacing.iconSize} color={theme.colors.disabled} />
                }
              />
              <Button
                title=""
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    priceTo: null,
                  }))
                }
                icon={
                  <BanknoteX
                    size={theme.spacing.iconSize}
                    color={isPriceAny ? theme.colors.background : theme.colors.textSecondary}
                  />
                }
                fullWidth={false}
                size="small"
                style={{
                  width: theme.spacing.inputHeight,
                  height: theme.spacing.inputHeight,
                  borderRadius: theme.spacing.radiusRound,
                  backgroundColor: isPriceAny
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                }}
                textStyle={{ display: 'none' }}
              />
            </View>
          </View>

          <View>
            <Text style={subTitleStyle}>Тип регистрации</Text>
            <ExpandableTabBar<ApprovalFilterOption>
              items={approvalItems}
              activeId={registrationId}
              onChange={(id) => setLocalFilters((prev) => ({ ...prev, registrationType: id }))}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.66}
            />
          </View>

          <View>
            <Text style={subTitleStyle}>Максимальное число участников</Text>
            <View style={styles.inlineRow}>
              <FormField
                label=""
                value={!isMaxParticipantsAny ? String(localFilters.maxParticipants ?? '') : ''}
                onChangeText={(text) => {
                  const parsed = parseMaxParticipantsInput(text);
                  if (!parsed) {
                    setLocalFilters((prev) => ({ ...prev, maxParticipants: null }));
                    return;
                  }
                  setLocalFilters((prev) => ({ ...prev, maxParticipants: parsed }));
                }}
                placeholder={isMaxParticipantsAny ? 'Не ограничивается' : '4'}
                keyboardType="number-pad"
                maxLength={5}
                style={{ width: '80%', marginBottom: 0 }}
              />
              <Button
                title=""
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    maxParticipants: null,
                  }))
                }
                icon={
                  <Infinity
                    size={theme.spacing.iconSize + 2}
                    color={isMaxParticipantsAny ? theme.colors.background : theme.colors.textSecondary}
                  />
                }
                fullWidth={false}
                size="small"
                style={{
                  width: theme.spacing.inputHeight,
                  height: theme.spacing.inputHeight,
                  borderRadius: theme.spacing.radiusRound,
                  backgroundColor: isMaxParticipantsAny
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                }}
                textStyle={{ display: 'none' }}
              />
            </View>
          </View>

          <View style={styles.inlineRow}>
            <Text style={subTitleStyle}>
              Показывать только{'\n'}доступные для участия
            </Text>
            <Switch
              value={localFilters.onlyAvailable}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, onlyAvailable: value }))
              }
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          </View>
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          <View style={[styles.inlineRow, { alignItems: 'center' }]}>
            <Text style={subTitleStyle}>Пол</Text>
            <ExpandableTabBar<GenderOption>
              items={genderItems}
              activeId={genderId}
              onChange={(id) => setLocalFilters((prev) => ({ ...prev, gender: id }))}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.65}
              containerStyle={{ width: '85%' }}
            />
          </View>

          <View>
            <Text style={subTitleStyle}>Возраст</Text>
            <View style={styles.inlineRow}>
              <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
                от
              </Text>
              <FormField
                label=""
                value={isAgeAny ? '' : String(ageFromValue)}
                onChangeText={(text) => applyAgeRange(text, String(ageToValue))}
                placeholder={"18"}
                keyboardType="number-pad"
                maxLength={3}
                style={{ width: '20%', marginBottom: 0 }}
              />
              <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
                до
              </Text>
              <FormField
                label=""
                value={isAgeAny ? '' : String(ageToValue)}
                onChangeText={(text) => applyAgeRange(String(ageFromValue), text)}
                placeholder={"122"}
                keyboardType="number-pad"
                maxLength={3}
                style={{ width: '20%', marginBottom: 0 }}
              />
              <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
                лет
              </Text>
              <Button
                title=""
                onPress={() => {
                  applyAgeRange('', '');
                }}
                icon={<Asterisk color={isAgeAny ? theme.colors.background : theme.colors.textSecondary} />}
                fullWidth={false}
                size="small"
                style={{
                  width: theme.spacing.inputHeight,
                  height: theme.spacing.inputHeight,
                  borderRadius: theme.spacing.radiusRound,
                  backgroundColor: isAgeAny ? theme.colors.primary : theme.colors.surfaceVariant
                }}
                textStyle={{ display: 'none' }}
              />
            </View>
          </View>

          {hasLevel && (
            <View>
              <Text style={subTitleStyle}>
                Уровень подготовки
              </Text>
              <ExpandableTabBar<LevelOption>
                items={levelItems}
                activeId={levelId}
                onChange={(id) => setLocalFilters((prev) => ({ ...prev, level: id }))}
                circleSize={theme.spacing.iconButtonHeight}
                iconSize={theme.spacing.iconSizeMedium}
                pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
                activePillWidth={0.5}
              />
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.inlineRow,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            borderTopWidth: theme.spacing.borderWidth,
            padding: theme.spacing.screenPaddingVertical,
          },
        ]}
      >
        <Button
          title='Сбросить'
          variant='secondary'
          onPress={handleReset}
          style={{ width: '35%', borderWidth: 0 }}
        />

        <Button
          title='Применить'
          variant='primary'
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
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
