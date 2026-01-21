import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { categories } from '@/mocks/activities';
import { User } from '@/types';

export default function OnboardingScreen() {
  const params = useLocalSearchParams();
  const { register, isRegistering } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleInterest = (interestName: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestName)
        ? prev.filter((name) => name !== interestName)
        : [...prev, interestName]
    );
  };

  const handleComplete = () => {
    if (selectedInterests.length === 0 || isRegistering) return;

    const userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const newUser: User = {
      id: userId,
      name: params.name as string,
      email: params.email as string,
      password: params.password as string,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      age: parseInt(params.age as string),
      rating: 4.5,
      gender: params.gender as 'male' | 'female' | 'other',
      interests: selectedInterests,
      createdEventsCount: 0,
      joinedEventsCount: 0,
      reviews: [],
      qrCode: `user-${userId}-qr`,
      attendanceHistory: {
        attended: 0,
        missed: 0,
        cancelled: 0,
      },
    };

    register(newUser);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Выберите интересы',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Что вам интересно?</Text>
            <Text style={styles.subtitle}>
              Выберите категории и подкатегории, чтобы мы могли рекомендовать вам подходящие
              события
            </Text>
            {selectedInterests.length > 0 && (
              <Text style={styles.counter}>Выбрано: {selectedInterests.length}</Text>
            )}
          </View>

          <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryBlock}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>

                {expandedCategories.includes(category.id) && (
                  <View style={styles.subcategoriesList}>
                    {category.subcategories.map((sub) => {
                      const isSelected = selectedInterests.includes(sub.name);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[
                            styles.subcategoryChip,
                            isSelected && styles.subcategoryChipSelected,
                          ]}
                          onPress={() => toggleInterest(sub.name)}
                        >
                          <Text
                            style={[
                              styles.subcategoryText,
                              isSelected && styles.subcategoryTextSelected,
                            ]}
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                (selectedInterests.length === 0 || isRegistering) &&
                  styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={selectedInterests.length === 0 || isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.completeButtonText}>Завершить регистрацию</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  subcategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingLeft: 12,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  subcategoryChipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  subcategoryTextSelected: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  completeButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
