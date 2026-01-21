import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { User, Mail, Lock } from 'lucide-react-native';

export default function AuthScreen() {
  const { accounts, switchAccount, login, isLoggingIn, loginError } = useAuth();
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const showAccountList = accounts.length > 0;

  const handleSelectAccount = (account: any) => {
    switchAccount(account);
  };

  const handleCreateNewAccount = () => {
    router.push('/register');
  };

  const handleEmailLogin = () => {
    if (!email.trim() || !password.trim()) return;
    
    login(email.toLowerCase().trim(), password);
  };

  const isEmailValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>WeDo</Text>
          </View>
          <Text style={styles.subtitle}>
            Находите события по интересам{'\n'}и знакомьтесь с людьми
          </Text>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {showEmailAuth ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowEmailAuth(false)}
              >
                <Text style={styles.backButtonText}>← Назад</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Вход по Email</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#999" />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@mail.com"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Пароль</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#999" />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, !isEmailValid && styles.primaryButtonDisabled]}
                onPress={handleEmailLogin}
                disabled={!isEmailValid || isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Войти</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateNewAccount}
              >
                <Text style={styles.secondaryButtonText}>Создать новый аккаунт</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          ) : showAccountList && accounts.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Войти как:</Text>
              
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.accountCard}
                  onPress={() => handleSelectAccount(account)}
                  disabled={isLoggingIn}
                >
                  <View style={styles.accountAvatar}>
                    <Text style={styles.accountAvatarText}>{account.name[0]}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountAge}>{account.age} лет</Text>
                  </View>
                  {isLoggingIn && <ActivityIndicator size="small" color="#000" />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateNewAccount}
                disabled={isLoggingIn}
              >
                <User size={20} color="#000" />
                <Text style={styles.createButtonText}>Создать новый аккаунт</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.emailAuthButton}
                onPress={() => setShowEmailAuth(true)}
              >
                <Mail size={20} color="#000" />
                <Text style={styles.emailAuthButtonText}>Войти по Email</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
              <Text style={styles.welcomeText}>
                Создайте аккаунт, чтобы начать находить события и знакомиться с единомышленниками
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreateNewAccount}
                disabled={isLoggingIn}
              >
                <Text style={styles.primaryButtonText}>Создать аккаунт</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowEmailAuth(true)}
              >
                <Text style={styles.secondaryButtonText}>Войти по Email</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  body: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 12,
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountAge: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  primaryButton: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  emailAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 8,
  },
  emailAuthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 16,
  },
  backButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});
