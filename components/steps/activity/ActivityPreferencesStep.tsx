import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { FormField } from '@/components/forms/FormField';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { Asterisk, Infinity } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ActivityCategory } from '@/types';
import { getGenderItems, getLevelItems, GenderOption, LevelOption, parseMaxParticipantsInput } from '@/constants/activityPreferenceOptions';

interface ActivityPreferencesStepProps {
  data: any;
  updateData: (data: any) => void;
  categories?: ActivityCategory[];
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export const ActivityPreferencesStep: React.FC<ActivityPreferencesStepProps> = ({
  data,
  updateData,
  errors,
  showErrors,
  categories = [],
}) => {
  const theme = useTheme();

  const maxParticipantsError = showErrors ? errors?.maxParticipants : undefined;
  const preferredAgeError = showErrors ? errors?.preferredAge : undefined;
  const levelError = showErrors ? errors?.level : undefined;
  const genderId: GenderOption = data.preferredGender ?? 'any';
  const levelId: LevelOption = data.level ?? 'intermediate';
  const isMaxParticipantsAny = Boolean(data.maxParticipantsAny);
  const isPreferredAgeAny = Boolean(data.preferredAgeAny);
  const ageFromValue = data.preferredAgeFrom ?? '';
  const ageToValue = data.preferredAgeTo ?? '';
  const selectedCategory = categories.find((cat) => cat.id === data.categoryId);
  const selectedSubcategory = selectedCategory?.subcategories.find((sub) => sub.id === data.subcategoryId);
  const hasLevel = selectedSubcategory?.hasLevel ?? selectedCategory?.hasLevel ?? true;

  const applyAgeRange = React.useCallback(
    (fromValue: string, toValue: string) => {
      const from = fromValue.replace(/\D/g, '').slice(0, 3);
      const to = toValue.replace(/\D/g, '').slice(0, 3);
      const hasRange = Boolean(from || to);
      updateData({
        preferredAgeAny: !hasRange,
        preferredAgeFrom: from,
        preferredAgeTo: to,
        preferredAge: from && to ? `от ${from} до ${to} лет` : '',
      });
    },
    [updateData]
  );

  const genderItems = useMemo(() => getGenderItems(), []);
  const levelItems = useMemo(() => getLevelItems(), []);

  return (
    <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>
      <View style={{ gap: theme.spacing.md }}>
        <View style={[styles.inlineRow, { marginBottom: theme.spacing.lg, alignItems: 'center' }]}>
          <Text style={{
            ...theme.typography.label,
            color: theme.colors.text,
            width: '15%'
          }}>
            Пол
          </Text>
          <ExpandableTabBar<GenderOption>
            items={genderItems}
            activeId={genderId}
            onChange={(id) => updateData({ preferredGender: id })}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSizeMedium}
            pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
            activePillWidth={0.65}
            containerStyle={{ width: '85%' }}
          />
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Возрастные ограничения
          </Text>
          <View style={styles.inlineRow}>
            <Text style={[{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
              от
            </Text>
            <FormField
              label=""
              value={isPreferredAgeAny ? '' : String(ageFromValue)}
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
              value={isPreferredAgeAny ? '' : String(ageToValue)}
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
              title=''
              onPress={() => { applyAgeRange('', ''); }}
              icon={<Asterisk color={isPreferredAgeAny ? theme.colors.background : theme.colors.textSecondary} />}
              fullWidth={false}
              size='small'
              style={{
                width: theme.spacing.inputHeight,
                height: theme.spacing.inputHeight,
                borderRadius: theme.spacing.radiusRound,
                backgroundColor: isPreferredAgeAny ? theme.colors.primary : theme.colors.surfaceVariant
              }}
              textStyle={{ display: 'none' }}
            />
          </View>
          {!!preferredAgeError && <Text style={{
            color: theme.colors.error,
            marginTop: theme.spacing.sm
          }}>
            {preferredAgeError}
          </Text>}
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Максимум участников
          </Text>
          <View style={styles.inlineRow}>
            <FormField
              label=""
              value={!isMaxParticipantsAny ? String(data.maxParticipants ?? '') : ''}
              onChangeText={(text) => {
                const parsed = parseMaxParticipantsInput(text);
                if (!parsed) {
                  updateData({ maxParticipantsAny: true, maxParticipants: '' });
                  return;
                }
                updateData({ maxParticipantsAny: false, maxParticipants: parsed });
              }}
              placeholder={"Не ограничивается"}
              keyboardType="number-pad"
              error={maxParticipantsError}
              maxLength={5}
              style={{ width: '80%', marginBottom: 0 }}
            />
            <Button
              title=''
              onPress={() => {
                updateData({ maxParticipantsAny: true, maxParticipants: '' });
              }}
              icon={<Infinity size={theme.spacing.iconSize + 2} color={isMaxParticipantsAny ? theme.colors.background : theme.colors.textSecondary} />}
              fullWidth={false}
              size='small'
              style={{
                width: theme.spacing.inputHeight,
                height: theme.spacing.inputHeight,
                borderRadius: theme.spacing.radiusRound,
                backgroundColor: isMaxParticipantsAny ? theme.colors.primary : theme.colors.surfaceVariant
              }}
              textStyle={{ display: 'none' }}
            />
          </View>
        </View>

        {hasLevel && (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
              Уровень подготовки
            </Text>
            <ExpandableTabBar<LevelOption>
              items={levelItems}
              activeId={levelId}
              onChange={(id) => updateData({ level: id })}
              circleSize={theme.spacing.iconButtonHeight}
              iconSize={theme.spacing.iconSizeMedium}
              pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
              activePillWidth={0.5}
            />
            {!!levelError && <Text style={{ color: theme.colors.error }}>{levelError}</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
