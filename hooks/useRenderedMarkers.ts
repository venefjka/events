import { useEffect, useRef, useState } from 'react';

import {
    type MapMarkerItem,
    getMarkerSetSignature,
} from './../utils/mapClusterUtils';

interface UseRenderedMarkersParams {
    markerItems: MapMarkerItem[];
    clusterZoomStep: number | null;
}

/**
 * temp fix для react-native-maps:
 * - если изменился шаг масштаба, делаем "жёсткий" двухфазный апдейт:
 *   [] -> nextItems
 * - если шаг масштаба не менялся, делаем мягкий апдейт без очистки
 * todo: исправить
 */
export const useRenderedMarkers = ({
    markerItems,
    clusterZoomStep,
}: UseRenderedMarkersParams) => {
    const [renderedMarkerItems, setRenderedMarkerItems] = useState<MapMarkerItem[]>([]);

    const lastRenderedSignatureRef = useRef<string>('');
    const lastRenderedZoomStepRef = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const nextItems = markerItems;
        const nextSignature = getMarkerSetSignature(nextItems);
        const prevSignature = lastRenderedSignatureRef.current;

        const nextZoomStep = clusterZoomStep;
        const prevZoomStep = lastRenderedZoomStepRef.current;

        if (prevSignature === nextSignature) {
            return;
        }

        const isFirstRender = prevSignature === '';

        const zoomStepChanged =
            !isFirstRender &&
            prevZoomStep != null &&
            nextZoomStep != null &&
            prevZoomStep !== nextZoomStep;

        const commitNextItems = () => {
            lastRenderedSignatureRef.current = nextSignature;
            lastRenderedZoomStepRef.current = nextZoomStep;
            setRenderedMarkerItems(nextItems);
        };

        if (isFirstRender) {
            commitNextItems();
            return;
        }

        if (zoomStepChanged) {
            setRenderedMarkerItems([]);

            requestAnimationFrame(() => {
                if (cancelled) return;
                commitNextItems();
            });

            return () => {
                cancelled = true;
            };
        }

        requestAnimationFrame(() => {
            if (cancelled) return;
            commitNextItems();
        });

        return () => {
            cancelled = true;
        };
    }, [markerItems, clusterZoomStep]);

    return renderedMarkerItems;
};