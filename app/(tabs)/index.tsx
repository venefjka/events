import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, Plus, Search as SearchIcon, ChevronDown, ChevronUp, Bookmark } from 'lucide-react-native';
import { router } from 'expo-router';
import { useActivities } from '../../contexts/ActivitiesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, TimeSegment } from '@/types';

const TIME_SEGMENTS = [
  { id: 'morning' as TimeSegment, label: 'Утро', time: '6:00-12:00' },
  { id: 'afternoon' as TimeSegment, label: 'День', time: '12:00-17:00' },
  { id: 'evening' as TimeSegment, label: 'Вечер', time: '17:00-23:00' },
  { id: 'now' as TimeSegment, label: 'Прямо сейчас', time: '+2 часа', highlight: true },
  { id: 'night' as TimeSegment, label: 'Ночь', time: '23:00-6:00' },
  { id: 'tomorrow' as TimeSegment, label: 'Завтра', time: '' },
  { id: 'weekend' as TimeSegment, label: 'Выходные', time: '' },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_COLLAPSED_HEIGHT = 200;
const MAP_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function ExploreScreen() {
  const { currentUser } = useAuth();
  const { activities, selectedTimeSegment, setSelectedTimeSegment, savedActivities, allActivities } = useActivities();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved'>('all');
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const mapHeight = useRef(new Animated.Value(MAP_EXPANDED_HEIGHT)).current;
  const cardsTop = useRef(new Animated.Value(MAP_EXPANDED_HEIGHT + 180)).current;
  const mapRef = useRef<MapView>(null);

  const toggleMapHeight = () => {
    const mapToValue = isMapExpanded ? MAP_COLLAPSED_HEIGHT : MAP_EXPANDED_HEIGHT;
    const cardsToValue = isMapExpanded ? MAP_COLLAPSED_HEIGHT + 180 : MAP_EXPANDED_HEIGHT + 180;
    
    Animated.parallel([
      Animated.spring(mapHeight, {
        toValue: mapToValue,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(cardsTop, {
        toValue: cardsToValue,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
    
    setIsMapExpanded(!isMapExpanded);
  };

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return activities;
    }

    const query = searchQuery.toLowerCase();
    return activities.filter(
      (activity: Activity) =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.category.name.toLowerCase().includes(query) ||
        activity.location.address.toLowerCase().includes(query)
    );
  }, [searchQuery, activities]);

  const recommendedActivities = useMemo(() => {
    if (!currentUser) return [];
    return allActivities
      .filter((activity: Activity) => {
        if (!filteredBySearch.find((a: Activity) => a.id === activity.id)) return false;
        
        const hasMatchingInterest = activity.category.name
          .toLowerCase()
          .split(' ')
          .some((word) =>
            currentUser.interests.some((interest) =>
              interest.toLowerCase().includes(word)
            )
          );
        const matchesLevel = activity.level === 'beginner' || activity.level === 'intermediate';
        return hasMatchingInterest || matchesLevel;
      })
      .slice(0, 10);
  }, [allActivities, currentUser, filteredBySearch]);

  const savedActivitiesList = useMemo(() => {
    return filteredBySearch.filter((a: Activity) => savedActivities.includes(a.id));
  }, [filteredBySearch, savedActivities]);

  const handleMarkerPress = (activityId: string) => {
    setSelectedMarkerId(activityId);
    if (!isMapExpanded) {
      toggleMapHeight();
    }
  };

  const selectedActivity = activities.find((a: Activity) => a.id === selectedMarkerId);

  const renderActivityCard = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => router.push(`/activity/${item.id}`)}
    >
      {item.photoUrl && (
        <View style={styles.activityImagePlaceholder}>
          <Text style={styles.categoryIcon}>{item.category.icon}</Text>
        </View>
      )}
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityCategory}>{item.category.name}</Text>
        <Text style={styles.activityTime}>
          {new Date(item.startTime).toLocaleString('ru', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityLocation}>{item.location.address}</Text>
          <Text style={styles.activityParticipants}>
            {item.currentParticipants.length}/{item.maxParticipants}
          </Text>
        </View>
        {!item.isFree && (
          <Text style={styles.activityPrice}>{item.price} ₽</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const displayActivities = activeTab === 'recommended' 
    ? recommendedActivities 
    : activeTab === 'saved' 
    ? savedActivitiesList 
    : filteredBySearch;

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>WeDo</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push('/filters')}
          >
            <Filter size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по названию, категории или месту"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeSegments}
          contentContainerStyle={styles.timeSegmentsContent}
        >
          {TIME_SEGMENTS.map((segment) => (
            <TouchableOpacity
              key={segment.id}
              style={[
                styles.timeSegment,
                selectedTimeSegment === segment.id && styles.timeSegmentActive,
                segment.highlight && styles.timeSegmentHighlight,
              ]}
              onPress={() => setSelectedTimeSegment(segment.id)}
            >
              <Text
                style={[
                  styles.timeSegmentLabel,
                  selectedTimeSegment === segment.id && styles.timeSegmentLabelActive,
                  segment.highlight && styles.timeSegmentLabelHighlight,
                ]}
              >
                {segment.label}
              </Text>
              {segment.time && (
                <Text
                  style={[
                    styles.timeSegmentTime,
                    selectedTimeSegment === segment.id && styles.timeSegmentTimeActive,
                  ]}
                >
                  {segment.time}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 55.751244,
            longitude: 37.618423,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {filteredBySearch.map((activity: Activity) => (
            <Marker
              key={activity.id}
              coordinate={{
                latitude: activity.location.latitude,
                longitude: activity.location.longitude,
              }}
              onPress={() => handleMarkerPress(activity.id)}
            >
              <View style={styles.marker}>
                <Text style={styles.markerIcon}>{activity.category.icon}</Text>
                {activity.currentParticipants.length > 0 && (
                  <View style={styles.markerBadge}>
                    <Text style={styles.markerBadgeText}>
                      {activity.currentParticipants.length}
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {selectedActivity && isMapExpanded && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewOrganizerInfo}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>
                    {selectedActivity.organizer.name[0]}
                  </Text>
                </View>
                <Text style={styles.previewOrganizerName}>
                  {selectedActivity.organizer.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedMarkerId(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.previewTitle}>{selectedActivity.title}</Text>
            <Text style={styles.previewTime}>
              {new Date(selectedActivity.startTime).toLocaleString('ru', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewParticipants}>
                {selectedActivity.currentParticipants.length}/{selectedActivity.maxParticipants}{' '}
                участников
              </Text>
              {!selectedActivity.isFree && (
                <Text style={styles.previewPrice}>{selectedActivity.price} ₽</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => router.push(`/activity/${selectedActivity.id}`)}
            >
              <Text style={styles.previewButtonText}>Подробнее</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.mapToggle} onPress={toggleMapHeight}>
          {isMapExpanded ? (
            <ChevronDown size={24} color="#000" />
          ) : (
            <ChevronUp size={24} color="#000" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.cardsContainer, { top: cardsTop }]}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Все ({filteredBySearch.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recommended' && styles.tabActive]}
            onPress={() => setActiveTab('recommended')}
          >
            <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>
              Рекомендуем
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Bookmark
              size={14}
              color={activeTab === 'saved' ? '#fff' : '#666'}
              fill={activeTab === 'saved' ? '#fff' : 'none'}
            />
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Сохраненные
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.cardsScroll}>
          {displayActivities.length > 0 ? (
            <FlatList
              data={displayActivities}
              renderItem={renderActivityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.activitiesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>
                {activeTab === 'saved' ? '📚' : '🔍'}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'saved' 
                  ? 'Нет сохраненных событий' 
                  : searchQuery 
                  ? 'Ничего не найдено' 
                  : 'Нет активностей'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeTab === 'saved' 
                  ? 'Сохраняйте интересные события, чтобы вернуться к ним позже'
                  : searchQuery 
                  ? 'Попробуйте изменить запрос или фильтры'
                  : 'Попробуйте изменить фильтры'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-activity')}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  timeSegments: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  timeSegmentsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  timeSegment: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  timeSegmentActive: {
    backgroundColor: '#000',
  },
  timeSegmentHighlight: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  timeSegmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timeSegmentLabelActive: {
    color: '#fff',
  },
  timeSegmentLabelHighlight: {
    color: '#000',
  },
  timeSegmentTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  timeSegmentTimeActive: {
    color: '#ccc',
  },
  mapContainer: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  markerIcon: {
    fontSize: 24,
  },
  markerBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  previewCard: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewOrganizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewOrganizerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewParticipants: {
    fontSize: 14,
    color: '#666',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  previewButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  mapToggle: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  cardsScroll: {
    flex: 1,
  },
  activitiesList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
  },
  activityImagePlaceholder: {
    height: 120,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 48,
  },
  activityContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLocation: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  activityParticipants: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  activityPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
