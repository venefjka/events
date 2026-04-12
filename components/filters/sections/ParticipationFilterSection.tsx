import React from 'react';
import { Switch, Text, View } from 'react-native';
import { BanknoteX, Infinity, RussianRuble } from 'lucide-react-native';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { getApprovalFilterItems } from '@/constants/activityPreferenceOptions';
import { useTheme } from '@/themes/useTheme';
import type { FilterSectionProps } from '../types';

export function ParticipationFilterSection({ controller }: FilterSectionProps) {
  const theme = useTheme();
  const approvalItems = React.useMemo(() => getApprovalFilterItems(), []);

  return (
    <View style={{ gap: theme.spacing.xxl }}>
      <View>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Стоимость участия до
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <FormField
            label=""
            value={!controller.isPriceAny ? String(controller.localFilters.priceTo ?? '') : ''}
            onChangeText={controller.handlePriceInput}
            placeholder="1 000 000"
            keyboardType="number-pad"
            maxLength={6}
            style={{ width: '80%', marginBottom: 0 }}
            rightIcon={
              controller.isPriceAny ? undefined : (
                <RussianRuble size={theme.spacing.iconSize} color={theme.colors.disabled} />
              )
            }
          />
          <Button
            title=""
            onPress={controller.clearPrice}
            icon={
              <BanknoteX
                size={theme.spacing.iconSize}
                color={controller.isPriceAny ? theme.colors.background : theme.colors.textSecondary}
              />
            }
            fullWidth={false}
            size="small"
            style={{
              width: theme.spacing.inputHeight,
              height: theme.spacing.inputHeight,
              borderRadius: theme.spacing.radiusRound,
              backgroundColor: controller.isPriceAny ? theme.colors.primary : theme.colors.surfaceVariant,
            }}
            textStyle={{ display: 'none' }}
          />
        </View>
      </View>

      <View>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Тип регистрации
        </Text>
        <ExpandableTabBar
          items={approvalItems}
          activeId={controller.registrationId}
          onChange={controller.handleRegistrationTypeChange}
          circleSize={theme.spacing.iconButtonHeight}
          iconSize={theme.spacing.iconSizeMedium}
          pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
          activePillWidth={0.66}
        />
      </View>

      <View>
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Максимальное число участников
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <FormField
            label=""
            value={!controller.isMaxParticipantsAny ? String(controller.localFilters.maxParticipants ?? '') : ''}
            onChangeText={controller.handleMaxParticipantsInput}
            placeholder={controller.isMaxParticipantsAny ? 'Не ограничивается' : '4'}
            keyboardType="number-pad"
            maxLength={5}
            style={{ width: '80%', marginBottom: 0 }}
          />
          <Button
            title=""
            onPress={controller.clearMaxParticipants}
            icon={
              <Infinity
                size={theme.spacing.iconSize + 2}
                color={
                  controller.isMaxParticipantsAny
                    ? theme.colors.background
                    : theme.colors.textSecondary
                }
              />
            }
            fullWidth={false}
            size="small"
            style={{
              width: theme.spacing.inputHeight,
              height: theme.spacing.inputHeight,
              borderRadius: theme.spacing.radiusRound,
              backgroundColor: controller.isMaxParticipantsAny
                ? theme.colors.primary
                : theme.colors.surfaceVariant,
            }}
            textStyle={{ display: 'none' }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ ...theme.typography.label, color: theme.colors.text }}>
          Показывать только{`\n`}доступные для участия
        </Text>
        <Switch
          value={controller.localFilters.onlyAvailable}
          onValueChange={controller.handleOnlyAvailableChange}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.background}
        />
      </View>
    </View>
  );
}
