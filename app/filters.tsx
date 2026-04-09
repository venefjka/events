import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities } from '@/contexts/ActivitiesContext';
import { categories } from '@/constants/categories';
import { DropdownInputSelector } from '@/components/forms/DropdownInputSelector';
import { DropdownChipSelector } from '@/components/forms/DropdownChipSelector';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { TimeSegmentPicker } from '@/components/TimeSegmentPicker';
import { TIME_SEGMENTS } from '@/constants/timeSegments';
import { getUtcOffsetOptions } from '@/utils/timezone';
import { useTheme } from '@/themes/useTheme';
import { ActivityScheduleCalendar } from '@/components/forms/ActivityScheduleCalendar';
import { parseDateInput, formatDateInputFromDateType } from '@/utils/date';
import { renderCategoryIcon } from '@/components/ui/СategoryIcon';
import { Asterisk, Infinity } from 'lucide-react-native';
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

export default function FiltersScreen() {
  const { filters, setFilters, setSelectedTimeSegment } = useActivities();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [localFilters, setLocalFilters] = useState(filters);
  const timeZoneOptions = useMemo(() => getUtcOffsetOptions(), []);
  const minTimeZoneValue = String(localFilters.timeZoneRange[0]);
  const maxTimeZoneValue = String(localFilters.timeZoneRange[1]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);

  const [cityError, setCityError] = useState<string | undefined>(undefined);
  const [citySuggestions, setCitySuggestions] = useState<CitySearchResult[]>([]);

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

  // const sectionTitleStyle = {
  //   ...theme.typography.h4, color: theme.colors.text, marginBottom: theme.spacing.lg 
  // };
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

  const handleApply = () => {
    if (localFilters.format === 'offline' && !localFilters.city?.trim()) {
      setCityError('Укажите город для оффлайн-событий');
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
      timeZoneRange: [-12, 14] as [number, number],
      format: 'offline' as const,
      city: '',
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    setCitySuggestions([]);
    setCityError(undefined);
  };

  const handleSelectCity = (place: CitySearchResult) => {
    setLocalFilters((prev) => ({ ...prev, city: place.settlement }));
    setCitySuggestions([]);
    setCityError(undefined);
  };

  const onCheckCity = async () => {
    const q = (localFilters.city ?? '').trim();

    setCityError(undefined);
    setCitySuggestions([]);

    if (!q) return;
    if (q.length < 2) {
      setCityError('Введите город (минимум 2 символа)');
      return;
    }

    try {
      const places = await verifyCityByNominatim(q);

      if (!places.length) {
        setCityError('Не удалось найти населенный пункт, проверьте написание');
        return;
      }

      if (places.length === 1) {
        handleSelectCity(places[0]);
        return;
      }

      setCitySuggestions(places);
    } catch (e) {
      setCityError('Ошибка поиска, попробуйте снова');
    }
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
      <ScrollView>
        <View style={sectionStyle}>
          {/* <Text style={sectionTitleStyle}>Что?</Text> */}

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
          {/* <Text style={sectionTitleStyle}>Где?</Text> */}

          <View>
            <Text style={subTitleStyle}>Формат проведения</Text>
            <ExpandableTabBar<'online' | 'offline'>
              items={formatItems}
              activeId={localFilters.format}
              onChange={(id) => {
                setLocalFilters((prev) => ({
                  ...prev,
                  format: id,
                  city: id === 'online' ? '' : prev.city,
                }));
                if (id === 'online') {
                  setCityError(undefined);
                  setCitySuggestions([]);
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
                value={localFilters.city ?? ''}
                onChangeText={(text) => {
                  setLocalFilters((prev) => ({ ...prev, city: text }));
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
                onBlur={onCheckCity}
                onFocus={() => {
                  setCitySuggestions([]);
                  setCityError(undefined);
                }}
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
          {/* <Text style={sectionTitleStyle}>Когда?</Text> */}

          <View style={{ gap: theme.spacing.lg }}>
            <ActivityScheduleCalendar
              variant="picker-only"
              isOpen={isCalendarOpen}
              onToggle={setIsCalendarOpen}
              startDate={startDate}
              endDate={endDate}
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

            {/* <TimeSegmentPicker
              segments={TIME_SEGMENTS}
              selectedSegment={localFilters.timeSegment}
              onSegmentSelect={(segment) =>
                setLocalFilters((prev) => ({ ...prev, timeSegment: segment }))
              }
            /> */}
          </View>
        </View>

        <View style={dividerStyle} />

        <View style={sectionStyle}>
          {/* <Text style={sectionTitleStyle}>Требования к участникам</Text> */}

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

          {/* <View style={styles.inlineRow}>
            <Text style={subTitleStyle}>
              Только есть свободные места
            </Text>
            <Switch
              value={localFilters.onlyAvailable}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, onlyAvailable: value }))
              }
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          </View> */}
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
                placeholder={isAgeAny ? "18" : "22"}
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
                placeholder={isAgeAny ? "122" : "24"}
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
                  if (isAgeAny) {
                    setLocalFilters((prev) => ({ ...prev, ageAny: false }));
                    return;
                  }
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
      </ScrollView>

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

