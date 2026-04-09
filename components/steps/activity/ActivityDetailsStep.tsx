import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { Button } from '@/components/ui/Button';
import { BanknoteX, RussianRuble } from 'lucide-react-native';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { ActivityFormat } from '@/types';
import { FormField } from '@/components/forms/FormField';
import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { ApprovalOption, getApprovalItems, getFormatItems } from '@/constants/activityPreferenceOptions';

interface ActivityDetailsStepProps {
  data: any;
  updateData: (data: any) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
  setScrollEnabled?: (enabled: boolean) => void;
}

export const ActivityDetailsStep: React.FC<ActivityDetailsStepProps> = ({
  data,
  updateData,
  errors,
  setScrollEnabled,
}) => {
  const theme = useTheme();

  const isFree = Boolean(data.isFree);


  const formatId: ActivityFormat = data.format ?? 'offline';

  const formatItems = useMemo(() => getFormatItems(), []);

  const photoUrls = React.useMemo(() => {
    if (Array.isArray(data.photoUrls)) {
      return data.photoUrls;
    }
    if (data.photoUrl) {
      return [data.photoUrl];
    }
    return [];
  }, [data.photoUrl, data.photoUrls]);

  React.useEffect(() => {
    if (!data.photoUrls && data.photoUrl) {
      updateData({ photoUrls: [data.photoUrl] });
    }
  }, [data.photoUrl, data.photoUrls, updateData]);


  const handlePhotosChange = React.useCallback(
    (nextPhotos: string[]) => {
      updateData({
        photoUrls: nextPhotos,
        photoUrl: nextPhotos[0],
      });
    },
    [updateData]
  );

  const approvalItems = useMemo(() => getApprovalItems(), []);
  const approvalValue: ApprovalOption = data.requiresApproval ? 'yes' : 'no';

  return (
    <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>
      <View style={{ gap: theme.spacing.xxxl }}>
        <PhotoPicker
          max={4}
          label='Фотографии'
          value={photoUrls}
          onChange={handlePhotosChange}
          onDragStateChange={(isDragging) => setScrollEnabled?.(!isDragging)}
        />

        <View>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Минимальная стоимость участия
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <FormField
              label=""
              value={isFree ? '' : String(data.price ?? '')}
              onChangeText={(text) => {
                const numeric = text.replace(/\D/g, '').slice(0, 6);
                if (!numeric) {
                  updateData({ isFree: true, price: '' });
                  return;
                }
                updateData({ isFree: false, price: parseInt(numeric, 10) || '' });
              }}
              placeholder={isFree ? "Бесплатно" : "600"}
              keyboardType="number-pad"
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              style={{ width: '80%', marginBottom: 0 }}
              rightIcon={isFree ? undefined : <RussianRuble size={theme.spacing.iconSize} color={theme.colors.disabled} />}
              error={errors?.price}
            />
            <Button
              title=''
              onPress={() => updateData({ isFree: !isFree, price: '' })}
              icon={<BanknoteX size={theme.spacing.iconSize} color={isFree ? theme.colors.background : theme.colors.textSecondary} />}
              fullWidth={false}
              size='small'
              style={{
                width: theme.spacing.inputHeight,
                height: theme.spacing.inputHeight,
                borderRadius: theme.spacing.radiusRound,
                backgroundColor: isFree ? theme.colors.primary : theme.colors.surfaceVariant
              }}
              textStyle={{ display: 'none' }}
            />
          </View>
        </View>

        <View style={[styles.row, { width: '100%', alignItems: 'center' }]}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            {'Тип\nрегистрации'}
          </Text>

          <ExpandableTabBar<'yes' | 'no'>
            items={approvalItems}
            activeId={approvalValue}
            onChange={(id) => updateData({ requiresApproval: id === 'yes' })}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSizeMedium}
            pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
            activePillWidth={0.78}
            containerStyle={{ width: '67%' }}
          />
        </View>

        <View>
          <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Формат проведения
          </Text>
          <ExpandableTabBar<ActivityFormat>
            items={formatItems}
            activeId={formatId}
            onChange={(id) => updateData({ format: id })}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSizeMedium}
            pillStyle={{ height: theme.spacing.inputHeight, borderRadius: theme.spacing.radiusRound }}
            activePillWidth={0.74}
          />
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
