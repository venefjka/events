import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/themes/useTheme';
import { NominatimPlace, reverseNominatim, searchNominatim } from '@/utils/nominatim';
import { Input } from '@/components/ui/Input';
import { darkMapStyle } from '@/constants/mapStyles';
import { categories } from '@/constants/categories';
import { MapPin } from '@/components/ui/MapPin';

interface ActivityLocationStepProps {
  data: any;
  updateData: (data: any) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export const ActivityLocationStep: React.FC<ActivityLocationStepProps> = ({
  data,
  updateData,
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const category =
    categories.find((item) => item.id === data.categoryId) ?? categories[0];

  if (!currentUser) return null;

  const fallbackLocation = currentUser.cityPlace;

  const location = data.location ?? fallbackLocation;
  const [isSearching, setIsSearching] = React.useState(false);
  const searchSeqRef = React.useRef(0);
  const lastAddressRef = React.useRef<string>('');
  const [region, setRegion] = React.useState<Region>({
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  //  авто‑инициализация локации из города пользователя, когда у формы ещё нет выбранной точки
  const shouldSyncCityLocation = Boolean(
    fallbackLocation &&
      (!data.location ||
        (data.location.latitude === 55.751244 && data.location.longitude === 37.618423))
  );

  React.useEffect(() => {
    if (shouldSyncCityLocation && fallbackLocation) {
      updateData({
        location: {
          latitude: fallbackLocation.latitude,
          longitude: fallbackLocation.longitude,
          settlement: fallbackLocation.settlement,
        },
      });
      setRegion((prev) => ({
        ...prev,
        latitude: fallbackLocation.latitude,
        longitude: fallbackLocation.longitude,
      }));
    }
  }, [fallbackLocation, shouldSyncCityLocation, updateData]);

  React.useEffect(() => {
    if (!location) return;
    setRegion((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }, [location?.latitude, location?.longitude]);

  const getSettlementFromPlace = (place?: NominatimPlace | null) => {
    const address = place?.address;
    if (!address) return '';
    return (
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality ||
      address.country ||
      address.state ||
      address.region ||
      ''
    );
  };

  const formatShortAddress = (place?: NominatimPlace | null) => {
    if (!place) return '';
    const address = place.address;
    if (address) {
      const road =
        address.road ||
        address.street ||
        address.residential ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        address.cycleway ||
        address.highway;
      const house =
        address.house_number ||
        address.house ||
        address.building ||
        address.public_building ||
        address.attraction ||
        address.amenity;
      if (road || house) {
        return [road, house].filter(Boolean).join(', ');
      }
      const fallbackName =
        address.neighbourhood ||
        address.suburb ||
        address.city_district ||
        address.town ||
        address.city ||
        address.village ||
        address.hamlet;
      if (fallbackName) return fallbackName;
    }

    if (place.display_name) {
      const parts = place.display_name
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.slice(0, 2).join(', ');
    }

    return '';
  };

  const handleMapPress = async (e: any) => {
    if (isSearching) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const seq = ++searchSeqRef.current;
    const searchStartedAt = Date.now();
    const prevAddress = String(data.address || '');
    lastAddressRef.current = prevAddress;

    updateData({
      location: {
        latitude,
        longitude,
        settlement: data.location?.settlement || '',
      },
      address: 'Идет поиск адреса',
    });
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    setIsSearching(true);

    try {
      const data = await reverseNominatim(latitude, longitude);
      const elapsed = Date.now() - searchStartedAt;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }
      if (seq !== searchSeqRef.current) return;

      updateData({
        location: {
          latitude,
          longitude,
          settlement: getSettlementFromPlace(data) || data?.address?.city || '',
        },
        address: formatShortAddress(data),
      });
    } catch (error) {
      const elapsed = Date.now() - searchStartedAt;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }
      if (seq !== searchSeqRef.current) return;
      updateData({ address: lastAddressRef.current || '' });
      console.log('Reverse geocoding error:', error);
    } finally {
      if (seq === searchSeqRef.current) {
        setIsSearching(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          customMapStyle={theme.isDark ? darkMapStyle : undefined}
        >
          {category && (
            <MapPin
              coordinate={location}
              category={category}
              draggable
              onDragEnd={handleMapPress}
            />
          )}
        </MapView>

        <View
          style={[
            styles.inputOverlay,
            {
              paddingHorizontal: theme.spacing.screenPaddingHorizontal,
              paddingTop: theme.spacing.md,
            },
          ]}
        >
          <Input
            label=''
            value={data.address || ''}
            onChangeText={() => { }}
            placeholder='Нажмите на карту для указания места'
            editable={false}
            backgroundColor={{ backgroundColor: theme.colors.background }}
            rightIcon={isSearching ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : undefined}
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
  mapContainer: {
    flex: 1,
    minHeight: 320,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  inputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
