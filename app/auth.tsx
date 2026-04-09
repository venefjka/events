import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Trash2, User, LogIn } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/themes/useTheme';
import { Theme } from '@/themes/theme';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FormField } from '@/components/forms/FormField';
import { Avatar } from '@/components/ui/Avatar';
import { RememberedUser, UserRecord } from '@/types';
import { getEmailError, getPasswordError } from '@/utils/validation';

export default function AuthScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { localUsers, rememberedUsers, switchAccount, login, deleteAccount, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const showAccountList = (rememberedUsers.length || localUsers.length) > 0;

  const rememberedList = rememberedUsers.length ? rememberedUsers : localUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  }));

  const handleSelectAccount = (user: UserRecord) => {
    switchAccount(user);
  };

  const handleCreateNewAccount = () => {
    router.push('/register');
  };

  const handleEmailLogin = () => {
    setShowErrors(true);
    const emailError = getEmailError(email);
    const passwordError = getPasswordError(password);

    if (emailError || passwordError) {
      return;
    }

    setShowLoginError(true);
    login(email.toLowerCase().trim(), password);
  };

  const handleDeleteAccount = (account: RememberedUser) => {
    Alert.alert(
      'Скрыть аккаунт?',
      `Скрыть ${account.name || account.email} с этого устройства?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Скрыть', style: 'destructive', onPress: () => deleteAccount(account.id) },
      ],
    );
  };

  const renderOrDivider = (text: string) => (
    <View style={styles.orRow}>
      <Divider spacing="none" style={styles.orLine} />
      <Text style={styles.orText}>{text}</Text>
      <Divider spacing="none" style={styles.orLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={{
          alignItems: 'center',
          paddingVertical: theme.spacing.xxxxl,
        }}>
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ ...theme.typography.logo, color: theme.colors.text }}>WeDo</Text>
          </View>
          <Text style={{
            ...theme.typography.body,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}>
            Находите события по интересам{'\n'}и знакомьтесь с людьми
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {showAccountList && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.accountRow}
              >
                <View style={styles.accountItem}>
                  <View style={styles.accountSelect}>
                    <View style={styles.accountLabelCircle}>
                      <LogIn size={24} color={theme.colors.text} />
                    </View>
                  </View>
                </View>
                {rememberedList.map((user) => (
                  <View key={user.id} style={styles.accountItem}>
                    <TouchableOpacity
                      style={styles.accountSelect}
                      onPress={() => {
                        const localUser = localUsers.find((item) => item.id === user.id);
                        if (!localUser) {
                          Alert.alert('Требуется вход', 'Введите пароль для входа в этот аккаунт.');
                          return;
                        }
                        handleSelectAccount(localUser);
                      }}
                      disabled={isLoggingIn}
                      activeOpacity={0.8}
                    >
                      <View style={styles.avatarWrap}>
                        <Avatar name={user.name} size="large" imageUrl={user.avatar} />
                        <TouchableOpacity
                          style={styles.accountDelete}
                          onPress={() => handleDeleteAccount(user)}
                          disabled={isLoggingIn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={theme.spacing.avatarSizeLarge / 5} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.accountName} numberOfLines={2}>
                        {user.name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {showAccountList && renderOrDivider('Быстрый вход')}

            <FormField
              label="Электронная почта"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setShowLoginError(false);
              }}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={theme.colors.textTertiary} />}
              autoComplete="email"
              textContentType="emailAddress"
              importantForAutofill="yes"
              style={{ paddingTop: theme.spacing.xl }}
              error={showErrors ? getEmailError(email) ?? undefined : undefined}
            />
            <FormField
              label="Пароль"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setShowLoginError(false);
              }}
              placeholder="••••••••"
              secureTextEntry
              icon={<Lock size={20} color={theme.colors.textTertiary} />}
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
              error={showErrors ? getPasswordError(password) ?? undefined : undefined}
            />

            <View style={{ gap: theme.spacing.xxl, marginTop: theme.spacing.md }}>
              <Button
                title="Войти"
                onPress={handleEmailLogin}
                disabled={!email.trim() || !password.trim()}
                loading={isLoggingIn}
                fullWidth
              />

              {!!loginError && showLoginError && <Text style={styles.errorText}>{loginError}</Text>}

              {renderOrDivider('или')}

              <Button
                title="Создать новый аккаунт"
                onPress={handleCreateNewAccount}
                variant="secondary"
                fullWidth
                icon={<User size={18} color={theme.colors.text} />}
              />

            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.lg,
    },
    errorText: {
      ...theme.typography.caption,
      color: theme.colors.error,
      textAlign: 'center',
    },
    accountRow: {
      flexDirection: 'row',
      paddingBottom: theme.spacing.xl,
      justifyContent: 'center',
      width: '100%'
    },
    accountItem: {
      alignItems: 'center',
    },
    accountSelect: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    accountLabelCircle: {
      width: theme.spacing.avatarSizeLarge,
      height: theme.spacing.avatarSizeLarge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarWrap: {
      position: 'relative',
    },
    accountName: {
      ...theme.typography.captionSmall,
      fontSize: 12,
      color: theme.colors.text,
      width: theme.spacing.avatarSizeLarge + 30,
      textAlign: 'center',
      lineHeight: 16,
    },
    accountDelete: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: theme.spacing.avatarSizeLarge / 3,
      height: theme.spacing.avatarSizeLarge / 3,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: theme.spacing.borderWidth / 2,
      borderColor: theme.colors.border,
    },
    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    orLine: {
      flex: 1,
    },
    orText: {
      ...theme.typography.captionSmall,
      color: theme.colors.textTertiary,
    },
  });


