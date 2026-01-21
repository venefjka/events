import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities } from '@/contexts/ActivitiesContext';
import { categories } from '@/mocks/activities';
import { TimeSegment } from '@/types';

export default function FiltersScreen() {
  const { filters, setFilters, setSelectedTimeSegment } = useActivities();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    if (localFilters.timeSegment) {
      setSelectedTimeSegment(localFilters.timeSegment);
    }
    router.back();
  };

  const handleReset = () => {
    const resetFilters = {
      categories: [],
      participantsRange: [1, 10] as [number, number],
      onlyAvailable: false,
      level: [],
      distance: 25,
      gender: 'any' as const,
      ageGroups: [],
      timeSegment: null,
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
  };

  const toggleCategory = (categoryId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setLocalFilters((prev) => ({
      ...prev,
      level: prev.level.includes(level)
        ? prev.level.filter((l) => l !== level)
        : [...prev.level, level],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Категории</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  localFilters.categories.includes(category.id) &&
                    styles.categoryChipActive,
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    localFilters.categories.includes(category.id) &&
                      styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Участники</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Только есть свободные места</Text>
            <Switch
              value={localFilters.onlyAvailable}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, onlyAvailable: value }))
              }
              trackColor={{ false: '#e5e5e5', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уровень подготовки</Text>
          <View style={styles.levelButtons}>
            <TouchableOpacity
              style={[
                styles.levelButton,
                localFilters.level.includes('beginner') && styles.levelButtonActive,
              ]}
              onPress={() => toggleLevel('beginner')}
            >
              <Text
                style={[
                  styles.levelButtonText,
                  localFilters.level.includes('beginner') && styles.levelButtonTextActive,
                ]}
              >
                Новичок
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.levelButton,
                localFilters.level.includes('intermediate') && styles.levelButtonActive,
              ]}
              onPress={() => toggleLevel('intermediate')}
            >
              <Text
                style={[
                  styles.levelButtonText,
                  localFilters.level.includes('intermediate') &&
                    styles.levelButtonTextActive,
                ]}
              >
                Любитель
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.levelButton,
                localFilters.level.includes('advanced') && styles.levelButtonActive,
              ]}
              onPress={() => toggleLevel('advanced')}
            >
              <Text
                style={[
                  styles.levelButtonText,
                  localFilters.level.includes('advanced') && styles.levelButtonTextActive,
                ]}
              >
                Профи
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Время</Text>
          <View style={styles.timeSegments}>
            {[
              { id: null, label: 'Любое' },
              { id: 'now' as TimeSegment, label: 'Прямо сейчас' },
              { id: 'morning' as TimeSegment, label: 'Утро' },
              { id: 'afternoon' as TimeSegment, label: 'День' },
              { id: 'evening' as TimeSegment, label: 'Вечер' },
              { id: 'night' as TimeSegment, label: 'Ночь' },
              { id: 'tomorrow' as TimeSegment, label: 'Завтра' },
              { id: 'weekend' as TimeSegment, label: 'Выходные' },
            ].map((segment) => (
              <TouchableOpacity
                key={segment.label}
                style={[
                  styles.timeSegmentButton,
                  localFilters.timeSegment === segment.id && styles.timeSegmentButtonActive,
                ]}
                onPress={() =>
                  setLocalFilters((prev) => ({ ...prev, timeSegment: segment.id }))
                }
              >
                <Text
                  style={[
                    styles.timeSegmentButtonText,
                    localFilters.timeSegment === segment.id && styles.timeSegmentButtonTextActive,
                  ]}
                >
                  {segment.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Расстояние</Text>
          <View style={styles.distanceButtons}>
            {[1, 2, 5, 10, 25].map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceButton,
                  localFilters.distance === distance && styles.distanceButtonActive,
                ]}
                onPress={() =>
                  setLocalFilters((prev) => ({ ...prev, distance }))
                }
              >
                <Text
                  style={[
                    styles.distanceButtonText,
                    localFilters.distance === distance && styles.distanceButtonTextActive,
                  ]}
                >
                  {distance} км
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Сбросить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Применить</Text>
        </TouchableOpacity>
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
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  categoryTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    color: '#000',
  },
  levelButtons: {
    gap: 8,
  },
  levelButton: {
    paddingVertical: 14,
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
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  distanceButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  distanceButtonTextActive: {
    color: '#fff',
  },
  timeSegments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSegmentButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  timeSegmentButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  timeSegmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  timeSegmentButtonTextActive: {
    color: '#fff',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
