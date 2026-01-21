import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  const handleContinue = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !age) return;

    router.push({
      pathname: '/onboarding',
      params: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password.trim(),
        age,
        gender,
      },
    });
  };

  const isValid = name.trim().length > 0 && 
    email.trim().length > 0 && 
    email.includes('@') &&
    password.trim().length >= 6 && 
    age.length > 0 && 
    parseInt(age) >= 18;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Регистрация',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Расскажите о себе</Text>
              <Text style={styles.subtitle}>
                Эта информация поможет другим пользователям узнать вас лучше
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Ваше имя</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Александр"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </View>

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
                    placeholder="Минимум 6 символов"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Возраст</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="28"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Пол</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'male' && styles.genderButtonTextActive,
                      ]}
                    >
                      Мужской
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'female' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'female' && styles.genderButtonTextActive,
                      ]}
                    >
                      Женский
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                    onPress={() => setGender('other')}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'other' && styles.genderButtonTextActive,
                      ]}
                    >
                      Другое
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={!isValid}
            >
              <Text style={styles.continueButtonText}>Продолжить</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  genderButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  continueButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
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
