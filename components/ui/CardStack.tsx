import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/themes/useTheme';
import { Chip } from './Chip';
import {
  SCROLLBAR_THUMB_SIZE,
  TRACK_THICKNESS,
  getTrackLength,
  getCardLeft,
  TRACK_GAP,
} from './cardStackHelpers';

type Orientation = 'vertical' | 'horizontal';

interface CardStackItemProps<T> {
  item: T;
  index: number;
  activeIndex: SharedValue<number>;
  swipeDirection: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
  cardsGap: number;
  listGap: number;
  visibleCount: number;
  maxVisibleItems: number;
  orientation: Orientation;
  containerWidth: number;
  containerHeight: number;
  showScrollBar: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
}

const CardStackItem = <T,>({
  item,
  index,
  activeIndex,
  swipeDirection,
  cardWidth,
  cardHeight,
  cardsGap,
  listGap,
  visibleCount,
  maxVisibleItems,
  orientation,
  containerWidth,
  containerHeight,
  showScrollBar,
  renderItem,
}: CardStackItemProps<T>) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isVertical = orientation === 'vertical';
    const itemSize = isVertical ? cardHeight : cardWidth;
    const itemStep = itemSize + listGap;
    const listLength = (Math.max(1, visibleCount) - 1) * itemStep;
    const naturalOffset = index * itemStep - activeIndex.value * itemStep;
    const topOverflow = Math.max(0, -naturalOffset);
    const bottomOverflow = Math.max(0, naturalOffset - listLength);
    const topStackProgress = Math.min(topOverflow / itemStep, maxVisibleItems);
    const bottomStackProgress = Math.min(bottomOverflow / itemStep, maxVisibleItems);
    const bottomStackIndex = Math.ceil(bottomStackProgress);
    const topDistance = Math.max(0, activeIndex.value - index);
    const bottomDistance = Math.max(0, index - activeIndex.value - (visibleCount - 1));
    const isTopStack = topOverflow > 0;
    const isBottomStack = bottomOverflow > 0;
    const isVisible = !isTopStack && !isBottomStack;
    let translate = 0;

    if (topOverflow > 0) {
      translate = -cardsGap * topStackProgress;
    } else if (bottomOverflow > 0) {
      translate = listLength + cardsGap * bottomStackProgress;
    } else {
      translate = naturalOffset;
    }

    let scale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0.96, 1, 1]
    );
    if (isTopStack) {
      scale = Math.max(0.85, 1 - topStackProgress * 0.03);
    }

    const isNextBottom = isBottomStack && bottomStackIndex === 1 && swipeDirection.value > 0;

    const centerLeft = getCardLeft(containerWidth, cardWidth, showScrollBar, isVertical);

    return {
      position: 'absolute' as const,
      left: centerLeft,
      top: (containerHeight - cardHeight) / 2,
      zIndex: isVisible
        ? 1000 - index
        : isNextBottom
          ? 1000 - index
          : isTopStack
            ? 500 - Math.ceil(topDistance)
            : 0 - Math.ceil(bottomDistance),
      transform: isVertical
        ? [{ translateY: translate }, { scale }]
        : [{ translateX: translate }, { scale }],
    };
  }, [
    cardHeight,
    cardWidth,
    cardsGap,
    index,
    listGap,
    maxVisibleItems,
    orientation,
    containerWidth,
    containerHeight,
    visibleCount,
    showScrollBar,
  ]);

  return (
    <Animated.View
      style={[{ width: cardWidth }, animatedStyle]}>
      {renderItem(item, index)}
    </Animated.View>
  );
};

interface CardStackProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  cardWidth?: number;
  cardHeight?: number;
  cardsGap: number;
  listGap?: number;
  maxVisibleItems?: number;
  durationMs?: number;
  fastDurationMs?: number;
  orientation?: Orientation;
  containerWidth: number;
  containerHeight: number;
  onIndexChange?: (index: number) => void;
  showScrollbar?: boolean;
}

export const CardStack = <T,>({
  data,
  renderItem,
  keyExtractor,
  cardWidth,
  cardHeight,
  cardsGap,
  listGap,
  maxVisibleItems = 4,
  durationMs = 300,
  fastDurationMs = 150,
  orientation = 'vertical',
  containerWidth,
  containerHeight,
  onIndexChange,
  showScrollbar = false,
}: CardStackProps<T>) => {
  const theme = useTheme();
  const activeIndex = useSharedValue(0);
  const [activeIndexJS, setActiveIndexJS] = React.useState(0);
  const [measuredSize, setMeasuredSize] = React.useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isMoving, setIsMoving] = React.useState(false);
  const movingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeDirection = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const visibleCount = 1;
  const maxFirstVisible = Math.max(0, data.length - visibleCount);
  const gap = listGap ?? cardsGap;
  const resolvedCardWidth = cardWidth ?? measuredSize?.width ?? 0;
  const resolvedCardHeight = cardHeight ?? measuredSize?.height ?? 0;
  const isVertical = orientation === 'vertical';
  const trackLength = getTrackLength(isVertical, resolvedCardHeight, resolvedCardWidth);
  const dragStartIndex = useSharedValue(0);
  const lastSentIndex = useSharedValue(-1);
  const lastSentTs = useSharedValue(0);
  const labelWidth = useSharedValue(0);
  const labelHeight = useSharedValue(0);
  const scrollbarThumbSize = SCROLLBAR_THUMB_SIZE;
  const trackThickness = TRACK_THICKNESS;
  const trackGap = TRACK_GAP;
  const cardLeft = getCardLeft(containerWidth, resolvedCardWidth, showScrollbar, isVertical);
  const cardTop = (containerHeight - resolvedCardHeight) / 2;
  const loadingCardLeft = cardLeft;
  const trackLeft = cardLeft;
  const trackTop = cardTop;
  // Если размеры карточки не заданы, измеряем на первом элементе.
  const shouldMeasure = (!cardWidth || !cardHeight) && data.length > 0;
  const ready = resolvedCardWidth > 0 && resolvedCardHeight > 0;

  React.useEffect(() => {
    if (activeIndex.value > maxFirstVisible) {
      activeIndex.value = maxFirstVisible;
      setActiveIndexJS(maxFirstVisible);
      onIndexChange?.(maxFirstVisible);
    }
  }, [activeIndex, maxFirstVisible, onIndexChange]);

  const updateActiveIndexJS = React.useCallback(
    (nextIndex: number) => {
      setActiveIndexJS(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [onIndexChange]
  );

  const markMoving = React.useCallback(() => {
    if (!isMoving) setIsMoving(true);
    if (movingTimeoutRef.current) {
      clearTimeout(movingTimeoutRef.current);
    }
    movingTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
      movingTimeoutRef.current = null;
    }, 500);
  }, [isMoving]);

  React.useEffect(() => {
    return () => {
      if (movingTimeoutRef.current) {
        clearTimeout(movingTimeoutRef.current);
      }
    };
  }, []);

  const animateToIndex = (nextIndex: number, durationOverrideMs?: number) => {
    'worklet';
    if (isAnimating.value) return;
    const clamped = Math.max(0, Math.min(nextIndex, maxFirstVisible));
    if (clamped === activeIndex.value) return;
    const target = Math.round(clamped);
    isAnimating.value = true;
    swipeDirection.value = target > activeIndex.value ? 1 : -1;
    runOnJS(updateActiveIndexJS)(target);
    activeIndex.value = withTiming(target, { duration: durationOverrideMs ?? durationMs }, () => {
      swipeDirection.value = 0;
      isAnimating.value = false;
    });
  };

  const panScrollbar = Gesture.Pan()
    .enabled(showScrollbar && data.length > 1)
    .onBegin((event) => {
      isAnimating.value = false;
      runOnJS(setIsDragging)(true);
      runOnJS(setIsMoving)(true);
      if (maxFirstVisible <= 0 || trackLength <= 0) {
        dragStartIndex.value = 0;
        activeIndex.value = 0;
        lastSentIndex.value = 0;
        runOnJS(updateActiveIndexJS)(0);
        return;
      }
      const pos = isVertical ? event.y : event.x;
      const rawIndex = (pos / trackLength) * maxFirstVisible;
      const startIndex = Math.max(0, Math.min(rawIndex, maxFirstVisible));
      dragStartIndex.value = startIndex;
      activeIndex.value = startIndex;
      lastSentIndex.value = Math.round(startIndex);
      runOnJS(updateActiveIndexJS)(lastSentIndex.value);
    })
    .onUpdate((event) => {
      if (maxFirstVisible <= 0 || trackLength <= 0) return;
      runOnJS(markMoving)();
      const delta = isVertical ? event.translationY : event.translationX;
      const trackStep = trackLength / maxFirstVisible;
      const nextIndex = Math.max(
        0,
        Math.min(dragStartIndex.value + delta / trackStep, maxFirstVisible)
      );
      activeIndex.value = nextIndex;
      swipeDirection.value = nextIndex >= dragStartIndex.value ? 1 : -1;
      const now = Date.now();
      // Ограничиваем частоту JS-обновлений индекса, чтобы не перегружать мост.
      if (now - lastSentTs.value < 60) return;
      const rounded = Math.round(nextIndex);
      if (rounded !== lastSentIndex.value) {
        lastSentIndex.value = rounded;
        lastSentTs.value = now;
        runOnJS(updateActiveIndexJS)(rounded);
      }
    })
    .onEnd(() => {
      runOnJS(setIsDragging)(false);
      runOnJS(setIsMoving)(false);
      const target = Math.max(0, Math.min(Math.round(activeIndex.value), maxFirstVisible));
      runOnJS(updateActiveIndexJS)(target);
      activeIndex.value = withTiming(target, { duration: fastDurationMs }, () => {
        swipeDirection.value = 0;
      });
    })
    .onFinalize(() => {
      runOnJS(setIsDragging)(false);
      runOnJS(setIsMoving)(false);
      swipeDirection.value = 0;
    });

  const scrollbarThumbStyle = useAnimatedStyle(() => {
    const trackLength = orientation === 'vertical' ? resolvedCardHeight : resolvedCardWidth;
    const maxTravel = Math.max(0, trackLength - scrollbarThumbSize);
    const progress = maxFirstVisible > 0 ? activeIndex.value / maxFirstVisible : 0;
    const translate = maxTravel * progress;
    return orientation === 'vertical'
      ? { transform: [{ translateY: translate }], height: scrollbarThumbSize }
      : { transform: [{ translateX: translate }], width: scrollbarThumbSize };
  }, [resolvedCardHeight, resolvedCardWidth, maxFirstVisible, orientation, scrollbarThumbSize]);

  const scrollbarLabelStyle = useAnimatedStyle(() => {
    const trackLength = orientation === 'vertical' ? resolvedCardHeight : resolvedCardWidth;
    const maxTravel = Math.max(0, trackLength - scrollbarThumbSize);
    const progress = maxFirstVisible > 0 ? activeIndex.value / maxFirstVisible : 0;
    const translate = maxTravel * progress;

    if (orientation === 'vertical') {
      const maxY = Math.max(0, trackLength - labelHeight.value);
      const clampedY = Math.max(0, Math.min(translate, maxY));
      return { transform: [{ translateY: clampedY }] };
    }
    const maxX = Math.max(0, trackLength - labelWidth.value);
    const clampedX = Math.max(0, Math.min(translate, maxX));
    return { transform: [{ translateX: clampedX }] };
  }, [resolvedCardHeight, resolvedCardWidth, maxFirstVisible, orientation, scrollbarThumbSize]);

  const flingUp = Gesture.Fling()
    .direction(isVertical ? Directions.UP : Directions.LEFT)
    .onStart(() => {
      animateToIndex(activeIndex.value + 1);
    });

  const flingDown = Gesture.Fling()
    .direction(isVertical ? Directions.DOWN : Directions.RIGHT)
    .onStart(() => {
      animateToIndex(activeIndex.value - 1);
    });

  const renderRadius = maxVisibleItems;
  // Рендерим только ближайшие карточки вокруг активной.
  const minIndex = Math.max(0, activeIndexJS - renderRadius);
  const maxIndex = Math.min(data.length - 1, activeIndexJS + renderRadius);

  if (!data.length) return <View />;

  return (
    <View>
      {shouldMeasure && (
        <View style={styles.measureLayer}>
          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              if (!width || !height) return;
              if (measuredSize?.width === width && measuredSize?.height === height) return;
              setMeasuredSize({ width, height: height - theme.spacing.md });
            }}
          >
            {renderItem(data[0], 0)}
          </View>
        </View>
      )}
      <View style={{ width: containerWidth, height: containerHeight }}>
        {ready && (
          <>
            {isDragging && isMoving ? (
              <LinearGradient
                colors={[theme.colors.border, theme.colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.loadingCard,
                  {
                    width: resolvedCardWidth,
                    height: resolvedCardHeight,
                    left: loadingCardLeft,
                    top: cardTop,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            ) : (
              <GestureDetector gesture={Gesture.Exclusive(flingUp, flingDown)}>
                <View style={styles.cardsLayer}>
                  {data.map((item, index) => {
                    if (index < minIndex || index > maxIndex) return null;
                    return (
                      <CardStackItem
                        key={keyExtractor(item, index)}
                        item={item}
                        index={index}
                        activeIndex={activeIndex}
                        swipeDirection={swipeDirection}
                        cardWidth={resolvedCardWidth}
                        cardHeight={resolvedCardHeight}
                        cardsGap={cardsGap}
                        listGap={gap}
                        visibleCount={visibleCount}
                        maxVisibleItems={maxVisibleItems}
                        orientation={orientation}
                        containerWidth={containerWidth}
                        containerHeight={containerHeight}
                        showScrollBar={showScrollbar}
                        renderItem={renderItem}
                      />
                    );
                  })}
                </View>
              </GestureDetector>
            )}
            {showScrollbar && (
              <GestureDetector gesture={panScrollbar}>
                <View
                  style={[
                    styles.scrollbarHitBox,
                    isVertical
                      ? {
                        width: trackThickness + 50,
                        height: resolvedCardHeight,
                        left: trackLeft + resolvedCardWidth + trackGap - 12,
                        top: trackTop,
                      }
                      : {
                        height: trackThickness + 50,
                        width: resolvedCardWidth,
                        left: trackLeft,
                        top: trackTop + resolvedCardHeight + trackGap - 12,
                      },
                  ]}
                >
                  <View
                    style={[
                      styles.scrollbarTrack,
                      { backgroundColor: theme.colors.surfaceVariant },
                      isVertical
                        ? {
                          width: trackThickness,
                          height: resolvedCardHeight,
                          left: 12,
                          top: 0,
                        }
                        : {
                          height: trackThickness,
                          width: resolvedCardWidth,
                          left: 0,
                          top: 12,
                        },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.scrollbarThumb,
                        { backgroundColor: theme.colors.primary, opacity: 0.3 },
                        isVertical
                          ? { width: trackThickness }
                          : { height: trackThickness },
                        scrollbarThumbStyle,
                      ]}
                    />
                    {isMoving &&
                      <Animated.View
                        style={[
                          styles.scrollbarLabel,
                          isVertical
                            ? { right: trackThickness + trackGap, top: trackThickness / 2, minWidth: 100 }
                            : { bottom: trackThickness + trackGap },
                          scrollbarLabelStyle,
                        ]}
                        onLayout={(event) => {
                          const { width, height } = event.nativeEvent.layout;
                          labelWidth.value = width;
                          labelHeight.value = height;
                        }}
                      >
                        <Chip
                          label={`${activeIndexJS + 1} из ${data.length}`}
                          size="small"
                          variant="bw"
                          selected
                        />
                      </Animated.View>
                    }
                  </View>
                </View>
              </GestureDetector>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  measureLayer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  scrollbarTrack: {
    position: 'absolute',
    borderRadius: 999,
  },
  scrollbarThumb: {
    borderRadius: 999,
  },
  scrollbarHitBox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  loadingCard: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
  },
  scrollbarLabel: {
    position: 'absolute',
  },
});
