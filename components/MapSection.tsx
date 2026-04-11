import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { Activity } from '@/types';
import { MapPin } from './ui/MapPin';
import { useTheme } from '@/themes/useTheme';
import { darkMapStyle } from '@/constants/mapStyles';
import { ActivityCard } from './cards/ActivityCard';
import { useAuth } from '@/contexts/AuthContext';

interface MapSectionProps {
    activities: Activity[];
    isMapExpanded: boolean;
    mapHeight: Animated.Value;
    selectedMarkerId: string | null;
    centerLatitude?: number | null;
    centerLongitude?: number | null;
    onMarkerPress: (activityId: string) => void;
    onClosePreview: () => void;
    onToggleExpand: () => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
    activities,
    isMapExpanded,
    mapHeight,
    selectedMarkerId,
    centerLatitude,
    centerLongitude,
    onMarkerPress,
    onClosePreview,
    onToggleExpand,
}) => {
    const { currentUser } = useAuth();
    const theme = useTheme();
    const isDark = theme.isDark;
    const mapRef = useRef<MapView>(null);
    const selectedActivity = activities.find((a) => a.id === selectedMarkerId);
    const cityPlace = currentUser?.cityPlace;

    const initialRegion = useMemo(() => ({
        latitude: centerLatitude ?? cityPlace?.latitude ?? 55.751244,
        longitude: centerLongitude ?? cityPlace?.longitude ?? 37.618423,
        latitudeDelta: 0.2,
        longitudeDelta: 0.1,
    }), [centerLatitude, centerLongitude, cityPlace?.latitude, cityPlace?.longitude]);

    useEffect(() => {
        const latitude = centerLatitude ?? cityPlace?.latitude;
        const longitude = centerLongitude ?? cityPlace?.longitude;

        if (latitude == null || longitude == null) {
            return;
        }

        mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.1,
        }, 300);
    }, [centerLatitude, centerLongitude, cityPlace?.latitude, cityPlace?.longitude]);

    return (
        <Animated.View style={[styles.mapContainer, { height: mapHeight, backgroundColor: theme.colors.background, }]}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                customMapStyle={isDark ? darkMapStyle : undefined}
            >
                {activities.map((activity) => (
                    <MapPin
                        key={activity.id}
                        coordinate={{
                            latitude: activity.location.latitude,
                            longitude: activity.location.longitude,
                        }}
                        category={activity.category}
                        onPress={() => onMarkerPress(activity.id)}
                    />
                ))}
            </MapView>

            {selectedActivity && isMapExpanded && (
                <ActivityCard
                    activity={selectedActivity}
                    mode='map'
                    onClose={onClosePreview}
                />
            )}

            <TouchableOpacity
                style={[styles.mapToggle, {
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.spacing.radiusRound,
                    width: 40,
                    height: 40,
                    shadowColor: theme.colors.primary,
                }]}
                onPress={onToggleExpand}
            >
                {isMapExpanded ? (
                    <ChevronUp size={theme.spacing.iconSizeLarge} color={theme.colors.text} />
                ) : (
                    <ChevronDown size={theme.spacing.iconSizeLarge} color={theme.colors.text} />
                )}
            </TouchableOpacity>
        </Animated.View>

    );
};

const styles = StyleSheet.create({
    mapContainer: {
        position: 'absolute',
        top: -20,
        left: 0,
        right: 0,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    mapToggle: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
});
