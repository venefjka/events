import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useActivities } from '@/contexts/ActivitiesContext';
import { categories } from '@/mocks/activities';
import * as ImagePicker from 'expo-image-picker';

export default function CreateActivityScreen() {
  const { createActivity } = useActivities();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({ latitude: 55.751244, longitude: 37.618423 });
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'weekends'>('none');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female' | 'mixed'>('any');
  const [preferredAge, setPreferredAge] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const geocodeAddress = async (addressText: string) => {
    try {
      const encodedAddress = encodeURIComponent(addressText);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLocation({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
      }
    } catch (error) {
      console.log('Geocoding error:', error);
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (text.length > 5) {
      geocodeAddress(text);
    }
  };

  const handleCreate = () => {
    if (!selectedCategory || !title) {
      return;
    }

    const category = categories.find((c) => c.id === selectedCategory);
    if (!category) return;

    const [hours, minutes] = time.split(':');
    const activityDate = new Date(date);
    activityDate.setHours(parseInt(hours), parseInt(minutes));

    createActivity({
      title,
      description,
      category,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || 'Москва, Центр',
      },
      date: activityDate.toISOString(),
      startTime: activityDate.toISOString(),
      maxParticipants,
      level,
      preferences: {
        gender: preferredGender,
        ageRange: preferredAge,
      },
      requiresApproval,
      photoUrl,
      repeat: repeat === 'none' ? undefined : repeat,
      price: isFree ? 0 : price,
      isFree,
      attendedUsers: [],
      ratings: [],
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
            <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
            <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
            <View style={[styles.progressStep, step >= 4 && styles.progressStepActive]} />
            <View style={[styles.progressStep, step >= 5 && styles.progressStepActive]} />
          </View>

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Что будем делать?</Text>
              <Text style={styles.stepSubtitle}>Выберите категорию активности</Text>

              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id && styles.categoryCardActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryCardIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryCardText,
                        selectedCategory === category.id && styles.categoryCardTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedCategory && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Название</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Например: Бег вдоль набережной"
                      placeholderTextColor="#999"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Описание</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Расскажите подробнее об активности"
                      placeholderTextColor="#999"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Фото (опционально)</Text>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                      {photoUrl ? (
                        <Text style={styles.photoButtonText}>Фото выбрано ✓</Text>
                      ) : (
                        <Text style={styles.photoButtonText}>+ Добавить фото</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Где встречаемся?</Text>
              <Text style={styles.stepSubtitle}>Укажите место проведения</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Адрес</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите адрес"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={handleAddressChange}
                />
              </View>

              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => setLocation(e.nativeEvent.coordinate)}
              >
                <Marker coordinate={location} draggable onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)} />
              </MapView>

              <Text style={styles.mapHint}>
                Нажмите на карту или перетащите маркер для точного указания места
              </Text>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Когда?</Text>
              <Text style={styles.stepSubtitle}>Выберите дату и время</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Дата</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-20"
                  placeholderTextColor="#999"
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Время начала</Text>
                <TextInput
                  style={styles.input}
                  placeholder="18:00"
                  placeholderTextColor="#999"
                  value={time}
                  onChangeText={setTime}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Повторяется</Text>
                <View style={styles.repeatButtons}>
                  {[
                    { id: 'none', label: 'Нет' },
                    { id: 'daily', label: 'Ежедневно' },
                    { id: 'weekly', label: 'Еженедельно' },
                    { id: 'weekends', label: 'Выходные' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.repeatButton,
                        repeat === option.id && styles.repeatButtonActive,
                      ]}
                      onPress={() => setRepeat(option.id as any)}
                    >
                      <Text
                        style={[
                          styles.repeatButtonText,
                          repeat === option.id && styles.repeatButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Для кого?</Text>
              <Text style={styles.stepSubtitle}>Настройте параметры группы</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Максимум участников</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setMaxParticipants(Math.max(2, maxParticipants - 1))}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{maxParticipants}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setMaxParticipants(Math.min(20, maxParticipants + 1))}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Желаемый пол</Text>
                <View style={styles.genderButtons}>
                  {[
                    { id: 'any', label: 'Любой' },
                    { id: 'male', label: 'Мужчины' },
                    { id: 'female', label: 'Женщины' },
                    { id: 'mixed', label: 'Смешанная' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.genderButton,
                        preferredGender === option.id && styles.genderButtonActive,
                      ]}
                      onPress={() => setPreferredGender(option.id as any)}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          preferredGender === option.id && styles.genderButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Возрастная группа (опционально)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: 18-35"
                  placeholderTextColor="#999"
                  value={preferredAge}
                  onChangeText={setPreferredAge}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Уровень навыка</Text>
                <View style={styles.levelButtons}>
                  {[
                    { id: 'beginner', label: 'Новичок' },
                    { id: 'intermediate', label: 'Любитель' },
                    { id: 'advanced', label: 'Профи' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.levelButton,
                        level === option.id && styles.levelButtonActive,
                      ]}
                      onPress={() => setLevel(option.id as any)}
                    >
                      <Text
                        style={[
                          styles.levelButtonText,
                          level === option.id && styles.levelButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Одобрение заявок</Text>
                  <Text style={styles.switchSubtext}>
                    Участники присоединяются только после вашего одобрения
                  </Text>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{ false: '#e5e5e5', true: '#000' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Стоимость участия</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Бесплатно</Text>
                  <Switch
                    value={isFree}
                    onValueChange={setIsFree}
                    trackColor={{ false: '#e5e5e5', true: '#000' }}
                    thumbColor="#fff"
                  />
                </View>
                {!isFree && (
                  <TextInput
                    style={styles.input}
                    placeholder="Введите стоимость в рублях"
                    placeholderTextColor="#999"
                    value={price.toString()}
                    onChangeText={(text) => setPrice(parseInt(text) || 0)}
                    keyboardType="numeric"
                  />
                )}
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Предпросмотр</Text>
              <Text style={styles.stepSubtitle}>Проверьте данные перед публикацией</Text>

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Ваша активность</Text>
                <Text style={styles.previewActivityTitle}>{title || 'Без названия'}</Text>
                <Text style={styles.previewDetail}>
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Text>
                <Text style={styles.previewDetail}>До {maxParticipants} участников</Text>
                <Text style={styles.previewDetail}>
                  {address || 'Москва, Центр'}
                </Text>
                <Text style={styles.previewDetail}>
                  {date} в {time} {repeat !== 'none' ? `(повторяется)` : ''}
                </Text>
                <Text style={styles.previewDetail}>
                  {isFree ? 'Бесплатно' : `${price} ₽`}
                </Text>
                <Text style={styles.previewDetail}>
                  {requiresApproval ? 'С одобрением заявок' : 'Свободное присоединение'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, step === 1 && styles.fullWidth]}
            onPress={() => {
              if (step === 5) {
                handleCreate();
              } else {
                setStep(step + 1);
              }
            }}
            disabled={step === 1 && (!selectedCategory || !title)}
          >
            <Text style={styles.nextButtonText}>
              {step === 5 ? 'Опубликовать' : 'Далее'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#000',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1.2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryCardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  categoryCardTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    minWidth: 60,
    textAlign: 'center',
  },
  previewCard: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  previewActivityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  previewDetail: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  map: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mapHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  repeatButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  repeatButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  repeatButtonTextActive: {
    color: '#fff',
  },
  genderButtons: {
    gap: 8,
  },
  genderButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#000',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  levelButtons: {
    gap: 8,
  },
  levelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#000',
  },
  levelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 13,
    color: '#666',
  },
  photoButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fullWidth: {
    flex: 1,
  },
});
