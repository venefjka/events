import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    TouchableOpacity,
    StyleSheet,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { ChevronUp, ChevronDown, X } from 'lucide-react-native';

import { useTheme } from '@/themes/useTheme';
import { darkMapStyle } from '@/constants/mapStyles';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin } from './ui/MapPin';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { CardStack } from '@/components/ui/CardStack';
import { useRenderedMarkers } from '@/hooks/useRenderedMarkers';
import {
    type MapRegion,
    type ClusterMarkerItem,
    buildPixelClusters,
    clusterHasSameCoordinates,
    getInitialRegion,
    getSnappedZoom,
    roundRegion,
    regionsAreAlmostEqual,
    MIN_CLUSTER_ZOOM_DELTA,
} from '@/utils/mapClusterUtils';
import { ActivityListItemDto } from '@/types';
import { getActivityCategory } from '@/utils/activity';

interface MapSectionProps {
    activities: ActivityListItemDto[];
    isMapExpanded: boolean;
    mapHeight: Animated.Value;
    centerLatitude?: number | null;
    centerLongitude?: number | null;
    onMarkerPress: (activityId: string) => void;
    onToggleExpand: () => void;
}

const CLUSTER_ZOOM_IN_THRESHOLD = 50;

export const MapSection: React.FC<MapSectionProps> = ({
    activities,
    isMapExpanded,
    mapHeight,
    centerLatitude,
    centerLongitude,
    onMarkerPress,
    onToggleExpand,
}) => {
    const { currentUser } = useAuth();
    const theme = useTheme();
    const isDark = theme.isDark;
    const mapRef = useRef<MapView>(null);
    const hasMountedRef = useRef(false);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const city = currentUser?.city;

    const initialRegion = useMemo(
        () =>
            getInitialRegion({
                centerLatitude,
                centerLongitude,
                fallbackLatitude: city?.latitude,
                fallbackLongitude: city?.longitude,
                latitudeDelta: 0.2,
                longitudeDelta: 0.1,
            }),
        [centerLatitude, centerLongitude, city?.latitude, city?.longitude]
    );

    const [mapRegion, setMapRegion] = useState<MapRegion>(initialRegion);
    const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

    const setRegionIfChanged = useCallback((nextRegion: MapRegion) => {
        setMapRegion((currentRegion) => {
            if (regionsAreAlmostEqual(currentRegion, nextRegion)) {
                return currentRegion;
            }
            return nextRegion;
        });
    }, []);

    const handleMapLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        setMapSize((prev) => {
            if (prev.width === width && prev.height === height) {
                return prev;
            }
            return { width, height };
        });
    }, []);

    const clusterRegion = useMemo(() => roundRegion(mapRegion), [mapRegion]);

    const clusterZoomStep = useMemo(() => {
        if (!mapSize.width) return null;
        return getSnappedZoom(clusterRegion, mapSize.width);
    }, [clusterRegion, mapSize.width]);

    const markerItems = useMemo(() => {
        return buildPixelClusters({
            activities,
            region: clusterRegion,
            mapWidth: mapSize.width,
            mapHeight: mapSize.height,
        });
    }, [activities, clusterRegion, mapSize.width, mapSize.height]);

    const renderedMarkerItems = useRenderedMarkers({
        markerItems,
        clusterZoomStep,
    });

    const selectedCluster = useMemo<ClusterMarkerItem | null>(() => {
        const cluster = renderedMarkerItems.find(
            (item): item is ClusterMarkerItem => item.isCluster && item.id === selectedClusterId
        );

        return cluster ?? null;
    }, [renderedMarkerItems, selectedClusterId]);

    const selectedActivity = useMemo(() => {
        return activities.find((activity) => activity.id === selectedActivityId) ?? null;
    }, [activities, selectedActivityId]);

    useEffect(() => {
        if (selectedActivityId && !selectedActivity) {
            setSelectedActivityId(null);
        }
    }, [selectedActivity, selectedActivityId]);

    useEffect(() => {
        if (selectedClusterId && !selectedCluster) {
            setSelectedClusterId(null);
        }
    }, [selectedCluster, selectedClusterId]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const latitude = centerLatitude ?? city?.latitude;
        const longitude = centerLongitude ?? city?.longitude;

        if (latitude == null || longitude == null) {
            return;
        }

        const nextRegion = getInitialRegion({
            centerLatitude: latitude,
            centerLongitude: longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.1,
        });

        mapRef.current?.animateToRegion(nextRegion, 300);
        setRegionIfChanged(nextRegion);
        setSelectedClusterId(null);
    }, [
        centerLatitude,
        centerLongitude,
        city?.latitude,
        city?.longitude,
        setRegionIfChanged,
    ]);

    const closeClusterStack = useCallback(() => {
        setSelectedClusterId(null);
    }, []);

    const handleRegionChangeComplete = useCallback(
        (region: Region) => {
            const nextRegion: MapRegion = {
                latitude: region.latitude,
                longitude: region.longitude,
                latitudeDelta: Math.max(region.latitudeDelta, MIN_CLUSTER_ZOOM_DELTA),
                longitudeDelta: Math.max(region.longitudeDelta, MIN_CLUSTER_ZOOM_DELTA),
            };

            setRegionIfChanged(nextRegion);
            setSelectedClusterId(null);
        },
        [setRegionIfChanged]
    );

    const handleClusterPress = useCallback(
        (item: ClusterMarkerItem) => {
            setSelectedActivityId(null);

            const sameCoordinates = clusterHasSameCoordinates(item.activities);

            if (sameCoordinates) {
                setSelectedClusterId(item.id);
                return;
            }

            if (item.badgeCount > CLUSTER_ZOOM_IN_THRESHOLD) {
                const nextRegion: MapRegion = {
                    latitude: item.coordinate.latitude,
                    longitude: item.coordinate.longitude,
                    latitudeDelta: Math.max(mapRegion.latitudeDelta * 0.45, 0.01),
                    longitudeDelta: Math.max(mapRegion.longitudeDelta * 0.45, 0.01),
                };

                setSelectedClusterId(null);
                mapRef.current?.animateToRegion(nextRegion, 250);
                return;
            }

            setSelectedClusterId(item.id);
        },
        [mapRegion.latitudeDelta, mapRegion.longitudeDelta]
    );

    const handleSingleMarkerPress = useCallback(
        (activityId: string) => {
            setSelectedClusterId(null);
            setSelectedActivityId(activityId);
            onMarkerPress(activityId);
        },
        [onMarkerPress]
    );

    const clusterStackCardWidth = Math.min(
        windowWidth - theme.spacing.screenPaddingHorizontal * 2,
        380
    );
    const clusterStackContainerHeight = Math.min(Math.max(windowHeight * 0.42, 320), 480);
    const isClusterStackVisible = Boolean(isMapExpanded && selectedCluster?.activities.length);

    return (
        <Animated.View
            style={[
                styles.mapContainer,
                {
                    height: mapHeight,
                    backgroundColor: theme.colors.background,
                },
            ]}
            onLayout={handleMapLayout}
        >
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                customMapStyle={isDark ? darkMapStyle : undefined}
                moveOnMarkerPress={false}
                toolbarEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {renderedMarkerItems.map((item) => (
                    <MapPin
                        key={item.id}
                        coordinate={item.coordinate}
                        category={getActivityCategory(item.isCluster ? item.activities[0] : item.activity)}
                        badgeCount={item.isCluster ? item.badgeCount : undefined}
                        isCluster={item.isCluster}
                        onPress={() => {
                            if (item.isCluster) {
                                handleClusterPress(item);
                                return;
                            }

                            handleSingleMarkerPress(item.activity.id);
                        }}
                    />
                ))}
            </MapView>

            {selectedActivity && isMapExpanded && (
                <ActivityCard
                    activity={selectedActivity}
                    mode='map'
                    onClose={() => setSelectedActivityId(null)}
                />
            )}

            {isClusterStackVisible && (
                <View style={styles.clusterOverlay} pointerEvents="box-none">
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.clusterBackdrop}
                        onPress={closeClusterStack}
                    />

                    <View
                        style={[
                            styles.clusterStackContainer,
                            {
                                width: windowWidth,
                                height: clusterStackContainerHeight,
                                bottom: theme.spacing.lg,
                                paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                            },
                        ]}
                        pointerEvents="box-none"
                    >
                        <TouchableOpacity
                            style={[
                                styles.clusterCloseButton,
                                {
                                    backgroundColor: theme.colors.background,
                                    shadowColor: theme.colors.primary,
                                },
                            ]}
                            onPress={closeClusterStack}
                        >
                            <X size={18} color={theme.colors.text} />
                        </TouchableOpacity>

                        <CardStack
                            data={selectedCluster?.activities ?? []}
                            keyExtractor={(activity) => activity.id}
                            renderItem={(activity) => (
                                <ActivityCard
                                    activity={activity}
                                    mode="list"
                                    style={{ width: clusterStackCardWidth }}
                                />
                            )}
                            cardsGap={theme.spacing.xl}
                            containerWidth={windowWidth}
                            containerHeight={clusterStackContainerHeight}
                            maxVisibleItems={2}
                            orientation="horizontal"
                            showScrollbar={(selectedCluster?.activities.length ?? 0) > 1}
                        />
                    </View>
                </View>
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
    clusterOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 30,
    },
    clusterBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    clusterStackContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: 12,
    },
    clusterCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
        zIndex: 40,
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
