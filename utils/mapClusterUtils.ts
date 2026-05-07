import { Activity } from '@/types';

export type MapRegion = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

export type Coordinate = {
    latitude: number;
    longitude: number;
};

export type SingleMarkerItem = {
    id: string;
    isCluster: false;
    activity: Activity;
    coordinate: Coordinate;
};

export type ClusterMarkerItem = {
    id: string;
    isCluster: true;
    badgeCount: number;
    activities: Activity[];
    coordinate: Coordinate;
};

export type MapMarkerItem = SingleMarkerItem | ClusterMarkerItem;

export const MARKER_CELL_SIZE_PX = 64;
export const REGION_MARGIN_FACTOR = 0.35;
export const MIN_CLUSTER_ZOOM_DELTA = 0.0005;
export const TILE_SIZE = 256;
export const CLUSTER_REGION_PRECISION = 2;
export const CLUSTER_ZOOM_STEP = 1;

export const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export const regionsAreAlmostEqual = (a: MapRegion, b: MapRegion) => {
    return (
        Math.abs(a.latitude - b.latitude) < 0.01 &&
        Math.abs(a.longitude - b.longitude) < 0.01 &&
        Math.abs(a.latitudeDelta - b.latitudeDelta) < 0.02 &&
        Math.abs(a.longitudeDelta - b.longitudeDelta) < 0.02
    );
};

export const normalizeLongitude = (longitude: number) => {
    let result = longitude;
    while (result < -180) result += 360;
    while (result > 180) result -= 360;
    return result;
};

export const clampLatitude = (latitude: number) =>
    clamp(latitude, -85.05112878, 85.05112878);

export const isWithinExpandedRegion = (
    coordinate: Coordinate,
    region: MapRegion,
    marginFactor: number = REGION_MARGIN_FACTOR
) => {
    const latitudeMargin = region.latitudeDelta * marginFactor;
    const longitudeMargin = region.longitudeDelta * marginFactor;

    const latMin = region.latitude - region.latitudeDelta / 2 - latitudeMargin;
    const latMax = region.latitude + region.latitudeDelta / 2 + latitudeMargin;
    const lngMin = region.longitude - region.longitudeDelta / 2 - longitudeMargin;
    const lngMax = region.longitude + region.longitudeDelta / 2 + longitudeMargin;

    return (
        coordinate.latitude >= latMin &&
        coordinate.latitude <= latMax &&
        coordinate.longitude >= lngMin &&
        coordinate.longitude <= lngMax
    );
};

export const longitudeToWorldX = (longitude: number) => {
    return ((normalizeLongitude(longitude) + 180) / 360) * TILE_SIZE;
};

export const latitudeToWorldY = (latitude: number) => {
    const lat = clampLatitude(latitude);
    const sin = Math.sin((lat * Math.PI) / 180);
    const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
    return y * TILE_SIZE;
};

export const getApproxZoomFromRegion = (region: MapRegion, mapWidthPx: number) => {
    const safeLngDelta = Math.max(region.longitudeDelta, 0.000001);
    const safeWidth = Math.max(mapWidthPx, 1);
    const zoom = Math.log2((360 * safeWidth) / (safeLngDelta * TILE_SIZE));
    return clamp(zoom, 0, 22);
};

export const getSnappedZoom = (
    region: MapRegion,
    mapWidthPx: number,
    zoomStep: number = CLUSTER_ZOOM_STEP
) => {
    const rawZoom = getApproxZoomFromRegion(region, mapWidthPx);
    return Math.round(rawZoom / zoomStep) * zoomStep;
};

export const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
};

export const getMarkerSetSignature = (items: MapMarkerItem[]) =>
    items.map((item) => item.id).sort().join('||');

export const roundRegion = (
    region: MapRegion,
    precision: number = CLUSTER_REGION_PRECISION
): MapRegion => ({
    latitude: Number(region.latitude.toFixed(precision)),
    longitude: Number(region.longitude.toFixed(precision)),
    latitudeDelta: Number(region.latitudeDelta.toFixed(precision)),
    longitudeDelta: Number(region.longitudeDelta.toFixed(precision)),
});

export const getInitialRegion = ({
    centerLatitude,
    centerLongitude,
    fallbackLatitude = 55.751244,
    fallbackLongitude = 37.618423,
    latitudeDelta = 0.2,
    longitudeDelta = 0.1,
}: {
    centerLatitude?: number | null;
    centerLongitude?: number | null;
    fallbackLatitude?: number | null;
    fallbackLongitude?: number | null;
    latitudeDelta?: number;
    longitudeDelta?: number;
}): MapRegion => ({
    latitude: centerLatitude ?? fallbackLatitude ?? 55.751244,
    longitude: centerLongitude ?? fallbackLongitude ?? 37.618423,
    latitudeDelta,
    longitudeDelta,
});

export const areCoordinatesClose = (
    a: Coordinate,
    b: Coordinate,
    epsilon = 0.000001
) => {
    return (
        Math.abs(a.latitude - b.latitude) < epsilon &&
        Math.abs(a.longitude - b.longitude) < epsilon
    );
};

export const clusterHasSameCoordinates = (activities: Activity[]) => {
    if (activities.length <= 1) return false;

    const first = activities[0].location;

    return activities.every((activity) =>
        areCoordinatesClose(
            { latitude: first.latitude, longitude: first.longitude },
            {
                latitude: activity.location.latitude,
                longitude: activity.location.longitude,
            }
        )
    );
};

type Bucket = {
    activities: Activity[];
    sumLatitude: number;
    sumLongitude: number;
};

export const filterVisibleActivities = (
    activities: Activity[],
    region: MapRegion,
    marginFactor: number = REGION_MARGIN_FACTOR
) => {
    return activities.filter((activity) =>
        isWithinExpandedRegion(
            {
                latitude: activity.location.latitude,
                longitude: activity.location.longitude,
            },
            region,
            marginFactor
        )
    );
};

export const bucketActivities = ({
    activities,
    region,
    mapWidth,
    mapHeight,
    cellSizePx = MARKER_CELL_SIZE_PX,
}: {
    activities: Activity[];
    region: MapRegion;
    mapWidth: number;
    mapHeight: number;
    cellSizePx?: number;
}) => {
    if (mapWidth <= 0 || mapHeight <= 0 || activities.length === 0) {
        return new Map<string, Bucket>();
    }

    const snappedZoom = getSnappedZoom(region, mapWidth);
    const scale = 2 ** snappedZoom;

    const buckets = new Map<string, Bucket>();

    for (const activity of activities) {
        const latitude = activity.location.latitude;
        const longitude = activity.location.longitude;

        const worldX = longitudeToWorldX(longitude) * scale;
        const worldY = latitudeToWorldY(latitude) * scale;

        const col = Math.floor(worldX / cellSizePx);
        const row = Math.floor(worldY / cellSizePx);
        const bucketKey = `${row}:${col}`;

        const bucket = buckets.get(bucketKey) ?? {
            activities: [],
            sumLatitude: 0,
            sumLongitude: 0,
        };

        bucket.activities.push(activity);
        bucket.sumLatitude += latitude;
        bucket.sumLongitude += longitude;
        buckets.set(bucketKey, bucket);
    }

    return buckets;
};

export const buildMarkerItemsFromBuckets = (buckets: Map<string, Bucket>): MapMarkerItem[] => {
    const items: MapMarkerItem[] = [];

    for (const [bucketKey, bucket] of buckets.entries()) {
        if (bucket.activities.length === 1) {
            const activity = bucket.activities[0];

            items.push({
                id: activity.id,
                isCluster: false,
                activity,
                coordinate: {
                    latitude: activity.location.latitude,
                    longitude: activity.location.longitude,
                },
            });

            continue;
        }

        const activityIdsSignature = bucket.activities
            .map((activity) => activity.id)
            .sort()
            .join('|');

        const signatureHash = hashString(activityIdsSignature);

        items.push({
            id: `cluster:${bucketKey}:${signatureHash}`,
            isCluster: true,
            badgeCount: bucket.activities.length,
            activities: bucket.activities,
            coordinate: {
                latitude: bucket.sumLatitude / bucket.activities.length,
                longitude: bucket.sumLongitude / bucket.activities.length,
            },
        });
    }

    return items;
};

export const buildPixelClusters = ({
    activities,
    region,
    mapWidth,
    mapHeight,
    marginFactor = REGION_MARGIN_FACTOR,
    cellSizePx = MARKER_CELL_SIZE_PX,
}: {
    activities: Activity[];
    region: MapRegion;
    mapWidth: number;
    mapHeight: number;
    marginFactor?: number;
    cellSizePx?: number;
}): MapMarkerItem[] => {
    if (mapWidth <= 0 || mapHeight <= 0 || activities.length === 0) {
        return [];
    }

    const visibleActivities = filterVisibleActivities(activities, region, marginFactor);

    if (visibleActivities.length === 0) {
        return [];
    }

    const buckets = bucketActivities({
        activities: visibleActivities,
        region,
        mapWidth,
        mapHeight,
        cellSizePx,
    });

    return buildMarkerItemsFromBuckets(buckets);
};