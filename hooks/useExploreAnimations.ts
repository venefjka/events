import { useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface UseExploreAnimationsProps {
    headerHeight: number;
}

export const useExploreAnimations = ({ headerHeight }: UseExploreAnimationsProps) => {
    const MAP_HEIGHTS = {
        COLLAPSED: 400,
        EXPANDED_PERCENTAGE: 0.85,
    } as const;

    headerHeight = -20; // temp fix - map animation 
    const MAP_EXPANDED_HEIGHT = SCREEN_HEIGHT * MAP_HEIGHTS.EXPANDED_PERCENTAGE;
    const MAP_COLLAPSED_HEIGHT = MAP_HEIGHTS.COLLAPSED;

    const [isMapExpanded, setIsMapExpanded] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const mapHeight = useRef(new Animated.Value(MAP_EXPANDED_HEIGHT)).current;
    const cardsTop = useRef(new Animated.Value(MAP_EXPANDED_HEIGHT + headerHeight)).current;

    const toggleMapHeight = () => {
        if (isAnimating) return;
        
        setIsAnimating(true);
        
        if (isMapExpanded) {
            // СВЕРНУТЬ карту: сначала поднимаем карточки, потом карту
            Animated.sequence([
                // Шаг 1: Поднимаем список активностей (шторку)
                Animated.timing(cardsTop, {
                    toValue: MAP_COLLAPSED_HEIGHT + headerHeight,
                    duration: 20,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.cubic),
                }),
                // Шаг 2: Сворачиваем карту
                Animated.timing(mapHeight, {
                    toValue: MAP_COLLAPSED_HEIGHT,
                    duration: 0,
                    delay: 0,
                    useNativeDriver: false,
                    easing: Easing.inOut(Easing.ease),
                }),
            ]).start(() => {
                setIsMapExpanded(false);
                setIsAnimating(false);
            });
        } else {
            // РАЗВЕРНУТЬ карту: сначала опускаем карту, потом карточки
            Animated.parallel([
                // Шаг 1: Разворачиваем карту
                Animated.timing(mapHeight, {
                    toValue: MAP_EXPANDED_HEIGHT,
                    duration: 0,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.cubic),
                }),
                // Шаг 2: Опускаем список активностей (с небольшой задержкой)
                Animated.timing(cardsTop, {
                    toValue: MAP_EXPANDED_HEIGHT + headerHeight,
                    duration: 200,
                    delay: 20, // Небольшая задержка
                    useNativeDriver: false,
                    easing: Easing.out(Easing.cubic),
                }),
            ]).start(() => {
                setIsMapExpanded(true);
                setIsAnimating(false);
            });
        }
    };

    return {
        isMapExpanded,
        mapHeight,
        cardsTop,
        toggleMapHeight,
        MAP_EXPANDED_HEIGHT,
        MAP_COLLAPSED_HEIGHT,
        isAnimating,
    };
};