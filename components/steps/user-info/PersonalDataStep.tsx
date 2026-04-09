import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { FormField } from '../../forms/FormField';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { Asterisk, Eye, EyeOff, MapPin } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDateInput } from '@/utils/formatInput';
import { verifyCityByNominatim, CitySearchResult, reverseGeocodeCityByNominatim } from '@/utils/verifyCity';
import { DropdownInputSelector } from '@/components/forms/DropdownInputSelector';
import { Button } from '@/components/ui/Button';
import * as Location from 'expo-location';

type GenderTabId = 'notgiven' | 'female' | 'male';
type BirthPublicTabId = 'yes' | 'no';

interface PersonalDataStepProps {
  data: any;
  updateData: (data: any) => void;
  mode?: 'register' | 'edit';
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export const PersonalDataStep: React.FC<PersonalDataStepProps> = ({ data, updateData, mode, errors, showErrors }) => {
  const theme = useTheme();
  const nameError = showErrors ? errors?.name : undefined;
  const birthDateError = showErrors ? errors?.birthDate : undefined;
  const cityValidationError = showErrors ? errors?.city : undefined;
  const [isLocating, setIsLocating] = useState<boolean>();

  const genderTabId: GenderTabId = (data.gender ?? 'notgiven') as GenderTabId;
  const birthPublicTabId: BirthPublicTabId = data.birthDatePublic ? 'yes' : 'no';

  const genderTabItems = useMemo(
    () => [
      {
        id: 'notgiven' as const,
        label: 'Не указывать',
        renderIcon: ({ color, size }: { color: string; size: number }) => (
          <Asterisk size={size * 1.2} color={color} />
        ),
      },
      {
        id: 'male' as const,
        label: 'Мужской',
        renderIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name="male" size={size} color={color} />
        ),
      },
      {
        id: 'female' as const,
        label: 'Женский',
        renderIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name="female" size={size} color={color} />
        ),
      },
    ],
    []
  );

  const birthPublicTabItems = useMemo(
    () => [
      {
        id: 'yes' as const,
        label: 'Да',
        renderIcon: ({ color, size }: { color: string; size: number }) => <Eye size={size} color={color} />,
      },
      {
        id: 'no' as const,
        label: 'Нет',
        renderIcon: ({ color, size }: { color: string; size: number }) => <EyeOff size={size} color={color} />,
      },
    ],
    []
  );

  const [cityError, setCityError] = useState<string | undefined>(undefined);
  const [citySuggestions, setCitySuggestions] = useState<CitySearchResult[]>([]);

  const cityText = data.cityText ?? '';

  const onCheckCity = async () => {
    const q = (data.cityText ?? '').trim();

    setCityError(undefined);
    setCitySuggestions([]);

    if (q.length < 2) {
      updateData({ cityVerified: false, cityPlace: null });
      setCityError('Введите город (минимум 2 символа)');
      return;
    }

    try {
      const places = await verifyCityByNominatim(q);

      if (!places.length) {
        updateData({ cityVerified: false, cityPlace: null });
        setCityError('Не удалось найти населённый пункт, проверьте написание');
        return;
      }

      if (places.length === 1) {
        handleSelectCity(places[0]);
        return;
      }

      updateData({ cityVerified: false, cityPlace: null });
      setCitySuggestions(places);
    } catch (e) {
      updateData({ cityVerified: false, cityPlace: null });
      setCityError('Ошибка поиска, попробуйте снова');
    }
  };

  const handleSelectCity = (place: CitySearchResult) => {
    updateData({
      cityVerified: true,
      cityText: place.title,
      cityPlace: {
        settlement: place.settlement,
        region: place.region,
        country: place.country,
        latitude: place.lat,
        longitude: place.lon,
      },
    });
    setCitySuggestions([]);
    setCityError(undefined);
  };

  const getCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    setCityError(undefined);
    setCitySuggestions([]);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCityError('Разрешение на геолокацию не предоставлено');
        setIsLocating(false);
        return;
      }

      const position = (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        }));

      const { latitude, longitude } = position.coords;
      const place = await reverseGeocodeCityByNominatim(latitude, longitude);
      if (!place) {
        setCityError('Не удалось определить город по геопозиции');
        setIsLocating(false);
        return;
      }

      handleSelectCity(place);
      setIsLocating(false);
    } catch (error) {
      setCityError('Не удалось определить город по геопозиции');
      setIsLocating(false);
    }
  };

  return (
    <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>
      <View style={{ gap: theme.spacing.md }}>
        {mode === 'register' && (
          <FormField
            label="Ваше имя"
            value={data.name || ''}
            onChangeText={(text) => updateData({ name: text })}
            placeholder="Александр"
            autoCapitalize="words"
            error={nameError}

            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
          />
        )}

        {/* Дата рождения + Отображать в профиле */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xxl }} >
          <View style={{
            flexBasis: '38%'
          }}>
            <FormField
              label="Дата рождения"
              value={data.birthDate || ''}
              onChangeText={(text) => updateData({ birthDate: formatDateInput(text) })}
              placeholder="ДД.ММ.ГГГГ"
              keyboardType="number-pad"
              maxLength={10}
              error={birthDateError}

              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                {
                  ...theme.typography.label,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Отображать в профиле
            </Text>

            <ExpandableTabBar<BirthPublicTabId>
              items={birthPublicTabItems}
              activeId={birthPublicTabId}
              onChange={(id) => updateData({ birthDatePublic: id === 'yes' })}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.70}
            />
          </View>
        </View>

        {/* Пол */}
        <View style={{ marginBottom: theme.spacing.lg, }}>
          <Text
            style={[
              {
                ...theme.typography.label,
                color: theme.colors.text,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            Пол
          </Text>

          <ExpandableTabBar<GenderTabId>
            items={genderTabItems}
            activeId={genderTabId}
            onChange={(id) => updateData({ gender: id })}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSize}
            pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
            activePillWidth={0.65}
          />
        </View>

        {/* Город */}
        <View>
          <DropdownInputSelector
            label="Город"
            value={cityText}
            onChangeText={(text) => {
              updateData({ cityText: text, cityVerified: false, cityPlace: null });
              setCityError(undefined);
            }}
            placeholder="Санкт-Петербург, Россия"
            autoCapitalize="words"
            suggestions={citySuggestions.map((place) => ({
              id: String(place.placeId),
              label: place.title,
            }))}
            onSelect={(item) => {
              const selected = citySuggestions.find((place) => String(place.placeId) === item.id);
              if (selected) {
                handleSelectCity(selected);
              }
            }}
            onBlur={onCheckCity}
            onFocus={() => {
              setCitySuggestions([]);
              setCityError(undefined);
            }}
            maxDropdownHeight={150}
            error={cityError || cityValidationError}
          />
          <View style={{ marginTop: theme.spacing.xxxl - 2, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl }}>
            <Button
              title='Где я?'
              onPress={getCurrentLocation}
              size='small'
              icon={<MapPin size={theme.spacing.iconSize} color={theme.colors.background} />}
              style={{ borderRadius: theme.spacing.radiusRound, height: theme.spacing.inputHeight, width: '35%' }}
              textStyle={{ ...theme.typography.captionBold }}
              loading={isLocating}
            />
            <Text style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              width: '65%'
            }}>
              {'Определит Ваш город автоматически'}
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

