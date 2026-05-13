import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, KeyRound, Tags, Trash2, UserRound } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { ExpandableTabBar, type ExpandableTabItem } from '@/components/ui/ExpandableTabs';
import { Header } from '@/components/ui/Header';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStep } from '@/components/steps/user-info/AccountStep';
import { PersonalDataStep } from '@/components/steps/user-info/PersonalDataStep';
import { InterestsStep } from '@/components/steps/user-info/InterestsStep';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteMeMutation, useUpdateMeMutation } from '@/hooks/mutations/useAuthMutations';
import { filesRepository } from '@/repositories/files.repository';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';
import type { UserProfileDto } from '@/types/dto';
import type { CityDto } from '@/types/shared';
import { getFileNameFromUri, getFileUrl, getMimeTypeFromUri, isRemoteUri } from '@/utils/files';
import {
  getBirthDateError,
  getConfirmPasswordError,
  getEmailError,
  getNameError,
  getPasswordError,
  toIsoBirthDate,
} from '@/utils/validation';

type EditTab = 'account' | 'personal' | 'interests';

type EditProfileFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatarFileId: string | null;
  avatarUri: string | null;
  birthDate: string;
  birthDatePublic: boolean;
  gender: 'male' | 'female' | 'notgiven';
  cityText: string;
  cityVerified: boolean;
  cityPlace: CityDto | null;
  interests: string[];
};

const tabs: ExpandableTabItem<EditTab>[] = [
  {
    id: 'personal',
    label: 'Личные данные',
    renderIcon: ({ size, color }) => <UserRound size={size} color={color} />,
  },
  {
    id: 'interests',
    label: 'Интересы',
    renderIcon: ({ size, color }) => <Tags size={size} color={color} />,
  },
  {
    id: 'account',
    label: 'Учетная запись',
    renderIcon: ({ size, color }) => <KeyRound size={size} color={color} />,
  },
];

const formatIsoBirthDate = (value?: string | null) => {
  const [year, month, day] = value?.split('-') ?? [];
  return year && month && day ? `${day}.${month}.${year}` : '';
};

const getCityTitle = (city?: CityDto | null) => {
  if (!city) return '';
  return city.title || [city.settlement, city.region, city.country].filter(Boolean).join(', ');
};

const createInitialData = (currentUser: UserProfileDto): EditProfileFormData => {
  const city = currentUser.city;

  return {
    name: currentUser.name,
    email: '',
    password: '',
    confirmPassword: '',
    avatarFileId: currentUser.avatarFileId ?? null,
    avatarUri: getFileUrl(currentUser.avatarFileId) ?? null,
    birthDate: formatIsoBirthDate(currentUser.birthDate),
    birthDatePublic: Boolean(currentUser.showBirthDate),
    gender: currentUser.gender ?? 'notgiven',
    cityText: getCityTitle(city),
    cityVerified: Boolean(city),
    cityPlace: city ?? null,
    interests: currentUser.interests ?? [],
  };
};

const getPersonalErrors = (data: EditProfileFormData) => {
  const errors: Record<string, string> = {};
  const nameError = getNameError(data.name ?? '');
  const birthDateError = getBirthDateError(data.birthDate ?? '');

  if (nameError) {
    errors.name = nameError;
  }
  if (birthDateError) {
    errors.birthDate = birthDateError;
  }
  if (!data.cityText?.trim()) {
    errors.city = 'Укажите город';
  } else if (!data.cityVerified) {
    errors.city = 'Подтвердите город';
  }

  return errors;
};

const getPersonalData = (data: EditProfileFormData) => ({
  name: data.name,
  avatarFileId: data.avatarFileId,
  avatarUri: data.avatarUri,
  birthDate: data.birthDate,
  birthDatePublic: data.birthDatePublic,
  gender: data.gender,
  cityText: data.cityText,
  cityVerified: data.cityVerified,
  cityPlace: data.cityPlace,
});

const getAccountData = (data: EditProfileFormData) => ({
  email: data.email,
  password: data.password,
  confirmPassword: data.confirmPassword,
});

const getAccountErrors = (data: EditProfileFormData) => {
  const errors: Record<string, string> = {};
  const emailError = getEmailError(data.email ?? '');
  const passwordError = getPasswordError(data.password ?? '', {
    email: data.email,
    name: data.name,
    required: false,
  });
  const confirmPasswordError = data.password
    ? getConfirmPasswordError(data.password, data.confirmPassword ?? '')
    : null;

  if (emailError) {
    errors.email = emailError;
  }
  if (passwordError) {
    errors.password = passwordError;
  }
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  }

  return errors;
};

const getTabDirty = (tab: EditTab, data: EditProfileFormData, initialData: EditProfileFormData) => {
  if (tab === 'personal') {
    return JSON.stringify(getPersonalData(data)) !== JSON.stringify(getPersonalData(initialData));
  }

  if (tab === 'interests') {
    return JSON.stringify(data.interests) !== JSON.stringify(initialData.interests);
  }

  return JSON.stringify(getAccountData(data)) !== JSON.stringify(getAccountData(initialData));
};

const getAvatarFileIdForSave = async (data: EditProfileFormData) => {
  if (!data.avatarUri) {
    return data.avatarFileId;
  }

  if (isRemoteUri(data.avatarUri)) {
    return data.avatarFileId;
  }

  const file = await filesRepository.upload({
    uri: data.avatarUri,
    name: getFileNameFromUri(data.avatarUri, 'avatar'),
    mimeType: getMimeTypeFromUri(data.avatarUri),
  });
  return file.id;
};

const pickAvatarUri = async () => {
  const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!existingPermission.granted) {
    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!requested.granted) {
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
};

export default function EditProfileScreen() {
  const { currentUser } = useAuth();
  const updateMeMutation = useUpdateMeMutation();
  const deleteMeMutation = useDeleteMeMutation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initialData = useMemo(
    () => (currentUser ? createInitialData(currentUser) : null),
    [currentUser]
  );
  const [activeTab, setActiveTab] = useState<EditTab>('personal');
  const [formData, setFormData] = useState<EditProfileFormData | null>(initialData);
  const [showPersonalErrors, setShowPersonalErrors] = useState(false);
  const [showAccountErrors, setShowAccountErrors] = useState(false);

  useEffect(() => {
    setFormData(initialData);
    setShowPersonalErrors(false);
    setShowAccountErrors(false);
  }, [initialData]);

  if (!currentUser || !initialData || !formData) {
    return null;
  }

  const isActiveTabDirty = getTabDirty(activeTab, formData, initialData);
  const isBusy = updateMeMutation.isPending || deleteMeMutation.isPending;
  const personalErrors = showPersonalErrors ? getPersonalErrors(formData) : {};
  const accountErrors = showAccountErrors ? getAccountErrors(formData) : {};

  const updateData = (patch: Partial<EditProfileFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const switchTab = (nextTab: EditTab) => {
    if (nextTab === activeTab) return;

    if (!isActiveTabDirty) {
      setActiveTab(nextTab);
      return;
    }

    Alert.alert(
      'У вас есть несохраненные данные',
      'Сначала сохраните или сбросьте изменения текущей вкладки.',
      [{ text: 'ОК', style: 'cancel' }]
    );
  };

  const resetChanges = () => {
    if (activeTab === 'personal') {
      setFormData((prev) => (prev ? { ...prev, ...getPersonalData(initialData) } : prev));
    } else if (activeTab === 'interests') {
      setFormData((prev) => (prev ? { ...prev, interests: initialData.interests } : prev));
    } else if (activeTab === 'account') {
      setFormData((prev) => (prev ? { ...prev, ...getAccountData(initialData) } : prev));
    }
    setShowPersonalErrors(false);
    setShowAccountErrors(false);
  };

  const saveChanges = async () => {
    if (activeTab === 'account') {
      const errors = getAccountErrors(formData);
      if (Object.keys(errors).length > 0) {
        setShowAccountErrors(true);
        return;
      }

      Alert.alert(
        'Пока недоступно',
        'Форма учетной записи уже добавлена, но контракт для сохранения этих данных еще не подключен.'
      );
      return;
    }

    try {
      if (activeTab === 'personal') {
        const errors = getPersonalErrors(formData);
        if (Object.keys(errors).length > 0 || !formData.cityPlace) {
          setShowPersonalErrors(true);
          return;
        }

        await updateMeMutation.mutateAsync({
          name: formData.name,
          avatarFileId: await getAvatarFileIdForSave(formData),
          birthDate: toIsoBirthDate(formData.birthDate),
          city: formData.cityPlace,
          gender: formData.gender,
          showBirthDate: formData.birthDatePublic,
        });
        setShowPersonalErrors(false);
        return;
      }

      await updateMeMutation.mutateAsync({
        interests: formData.interests,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить профиль';
      Alert.alert('Ошибка', message);
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Удалить профиль',
      'Профиль будет удален, а ваши персональные данные будут очищены. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeMutation.mutateAsync();
              router.replace('/auth');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Не удалось удалить профиль';
              Alert.alert('Ошибка', message);
            }
          },
        },
      ]
    );
  };

  const handlePickAvatar = async () => {
    const uri = await pickAvatarUri();
    if (uri) {
      updateData({ avatarUri: uri });
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'account') {
      return (
        <View>
          <AccountStep
            data={formData}
            updateData={updateData}
            mode="edit"
            errors={accountErrors}
            showErrors={showAccountErrors}
          />

          <View style={styles.accountActions}>
            <Button
              title="Удалить профиль"
              onPress={handleDeleteProfile}
              variant="ghost"
              size="medium"
              fullWidth
              loading={deleteMeMutation.isPending}
              disabled={updateMeMutation.isPending}
              icon={<Trash2 size={theme.spacing.iconSize} color={theme.colors.error} />}
              textStyle={{ color: theme.colors.error }}
              style={{ borderColor: theme.colors.error }}
            />
          </View>
        </View>
      );
    }

    if (activeTab === 'personal') {
      return (
        <View>
          <Pressable style={styles.avatarButton} onPress={handlePickAvatar}>
            {formData.avatarUri ? (
              <Image source={{ uri: formData.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Avatar name={formData.name} size="large" style={styles.avatarFallback} />
            )}
            <View style={styles.avatarEditBadge}>
              <Camera size={theme.spacing.iconSizeSmall} color={theme.colors.primary} />
            </View>
          </Pressable>
          <PersonalDataStep
            data={formData}
            updateData={updateData}
            mode="edit"
            errors={personalErrors}
            showErrors={showPersonalErrors}
          />
        </View>
      );
    }

    return (
      <InterestsStep
        data={formData}
        updateData={updateData}
        mode="edit"
      />
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          title="Редактирование профиля"
          showBackButton
          onBackPress={() => router.back()}
          borderBottom={false}
          backgroundColor={theme.colors.surface}
          heightVariant="short"
        />

        <View style={styles.tabs}>
          <ExpandableTabBar
            items={tabs}
            activeId={activeTab}
            onChange={switchTab}
            gap={theme.spacing.sm}
            circleSize={theme.spacing.iconButtonHeight}
            iconSize={theme.spacing.iconSize * 0.9}
            activePillWidth={0.72}
            labelTextStyle={theme.typography.captionBold}
          />
        </View>

        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          enableOnAndroid
          extraScrollHeight={-70}
          keyboardShouldPersistTaps="handled"
        >
          {renderTabContent()}
        </KeyboardAwareScrollView>

        <View style={styles.footer}>
          <Button
            title="Сбросить изменения"
            onPress={resetChanges}
            variant="secondary"
            size="medium"
            disabled={!isActiveTabDirty || isBusy}
            style={{ backgroundColor: theme.colors.borderLight }}
          />
          <Button
            title="Сохранить"
            onPress={saveChanges}
            variant="primary"
            size="medium"
            loading={updateMeMutation.isPending}
            disabled={!isActiveTabDirty || deleteMeMutation.isPending}
            style={{ width: '38%' }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    safeArea: {
      flex: 1,
    },
    tabs: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: theme.spacing.borderWidth,
      borderBottomColor: theme.colors.border,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flexGrow: 1,
      backgroundColor: theme.colors.background,
    },
    accountActions: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      marginTop: -theme.spacing.lg,
    },
    avatarButton: {
      alignSelf: 'center',
      width: theme.spacing.avatarSizeXLarge,
      height: theme.spacing.avatarSizeXLarge,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: -theme.spacing.md,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: theme.spacing.radiusRound,
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      borderRadius: theme.spacing.radiusRound,
    },
    avatarEditBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: theme.spacing.xxxl,
      height: theme.spacing.xxxl,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
      borderTopWidth: theme.spacing.borderWidth,
      borderTopColor: theme.colors.border,
    },
  });
