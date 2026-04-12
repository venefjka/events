import React from 'react';
import { Text, View } from 'react-native';
import { Asterisk } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { FormField } from '@/components/forms/FormField';
import { getGenderItems, getLevelItems } from '@/constants/activityPreferenceOptions';
import { useTheme } from '@/themes/useTheme';
import type { FilterSectionProps } from '../types';

export function PreferencesFilterSection({ controller }: FilterSectionProps) {
  const theme = useTheme();
  const genderItems = React.useMemo(() => getGenderItems(), []);
  const levelItems = React.useMemo(() => getLevelItems(), []);

  return (
    <View style={{ gap: theme.spacing.xxl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Пол
        </Text>
        <ExpandableTabBar
          items={genderItems}
          activeId={controller.genderId}
          onChange={controller.handleGenderChange}
          circleSize={theme.spacing.iconButtonHeight}
          iconSize={theme.spacing.iconSizeMedium}
          pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
          activePillWidth={0.65}
          containerStyle={{ width: '85%' }}
        />
      </View>

      <View>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Возраст
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }}>
            от
          </Text>
          <FormField
            label=""
            value={controller.isAgeAny ? '' : String(controller.ageFromValue)}
            onChangeText={(text) => controller.applyAgeRange(text, String(controller.ageToValue))}
            placeholder="18"
            keyboardType="number-pad"
            maxLength={3}
            style={{ width: '20%', marginBottom: 0 }}
          />
          <Text style={{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }}>
            до
          </Text>
          <FormField
            label=""
            value={controller.isAgeAny ? '' : String(controller.ageToValue)}
            onChangeText={(text) => controller.applyAgeRange(String(controller.ageFromValue), text)}
            placeholder="122"
            keyboardType="number-pad"
            maxLength={3}
            style={{ width: '20%', marginBottom: 0 }}
          />
          <Text style={{ ...theme.typography.captionBold, color: theme.colors.textTertiary, marginTop: theme.spacing.lg }}>
            лет
          </Text>
          <Button
            title=""
            onPress={() => controller.applyAgeRange('', '')}
            icon={
              <Asterisk
                color={controller.isAgeAny ? theme.colors.background : theme.colors.textSecondary}
              />
            }
            fullWidth={false}
            size="small"
            style={{
              width: theme.spacing.inputHeight,
              height: theme.spacing.inputHeight,
              borderRadius: theme.spacing.radiusRound,
              backgroundColor: controller.isAgeAny ? theme.colors.primary : theme.colors.surfaceVariant,
            }}
            textStyle={{ display: 'none' }}
          />
        </View>
      </View>

      {controller.hasLevel ? (
        <View>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Уровень подготовки
          </Text>
          <ExpandableTabBar
            items={levelItems}
            activeId={controller.levelId}
            onChange={controller.handleLevelChange}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSizeMedium}
            pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
            activePillWidth={0.5}
          />
        </View>
      ) : null}
    </View>
  );
}
