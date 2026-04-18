import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';

interface PhotoViewerModalProps {
  visible: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export function PhotoViewerModal({
  visible,
  photos,
  initialIndex = 0,
  onClose,
}: PhotoViewerModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const stageWidth = useSharedValue(0);
  const stageHeight = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const overlayReveal = useSharedValue(0);

  React.useEffect(() => {
    if (!visible) return;

    const nextIndex = Math.max(0, Math.min(initialIndex, Math.max(photos.length - 1, 0)));
    setActiveIndex(nextIndex);
    overlayReveal.value = 0;
    overlayReveal.value = withTiming(1, { duration: 180 });
  }, [initialIndex, overlayReveal, photos.length, visible]);

  React.useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [activeIndex, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  const activePhoto = photos[activeIndex];
  const overlayGap = StyleSheet.hairlineWidth;

  const showPreviousPhoto = React.useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  const showNextPhoto = React.useCallback(() => {
    setActiveIndex((current) => Math.min(photos.length - 1, current + 1));
  }, [photos.length]);

  const handlePhotoSwipe = React.useCallback(
    (translationX: number, translationY: number) => {
      const swipeThreshold = stageWidth.value > 0 ? stageWidth.value * 0.12 : 48;
      const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);

      if (!isHorizontalSwipe) return;

      if (translationX <= -swipeThreshold) {
        showNextPhoto();
      } else if (translationX >= swipeThreshold) {
        showPreviousPhoto();
      }
    },
    [showNextPhoto, showPreviousPhoto, stageWidth]
  );

  const getBoundX = (nextScale: number) => {
    'worklet';
    if (nextScale <= 1 || stageWidth.value <= 0) return 0;
    return ((stageWidth.value * nextScale) - stageWidth.value) / 2;
  };

  const getBoundY = (nextScale: number) => {
    'worklet';
    if (nextScale <= 1 || stageHeight.value <= 0) return 0;
    return ((stageHeight.value * nextScale) - stageHeight.value) / 2;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(savedScale.value * event.scale, 1, 4);
      scale.value = nextScale;

      const boundX = getBoundX(nextScale);
      const boundY = getBoundY(nextScale);

      translateX.value = clamp(savedTranslateX.value, -boundX, boundX);
      translateY.value = clamp(savedTranslateY.value, -boundY, boundY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const boundX = getBoundX(scale.value);
      const boundY = getBoundY(scale.value);
      savedTranslateX.value = clamp(translateX.value, -boundX, boundX);
      savedTranslateY.value = clamp(translateY.value, -boundY, boundY);
      translateX.value = savedTranslateX.value;
      translateY.value = savedTranslateY.value;
    });

  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onUpdate((event) => {
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
        return;
      }

      const boundX = getBoundX(scale.value);
      const boundY = getBoundY(scale.value);

      translateX.value = clamp(savedTranslateX.value + event.translationX, -boundX, boundX);
      translateY.value = clamp(savedTranslateY.value + event.translationY, -boundY, boundY);
    })
    .onEnd((event) => {
      if (scale.value <= 1) {
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        translateX.value = 0;
        translateY.value = 0;
        runOnJS(handlePhotoSwipe)(event.translationX, event.translationY);
        return;
      }

      const boundX = getBoundX(scale.value);
      const boundY = getBoundY(scale.value);

      savedTranslateX.value = clamp(translateX.value, -boundX, boundX);
      savedTranslateY.value = clamp(translateY.value, -boundY, boundY);
      translateX.value = savedTranslateX.value;
      translateY.value = savedTranslateY.value;
    });

  const photoGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayReveal.value,
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <GestureHandlerRootView style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, animatedOverlayStyle]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.backButton}>
                <ChevronLeft size={24} color="#fff" />
                <Text style={styles.backLabel}>Назад</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.stageSection}>
            <View
              style={[
                styles.stage,
                {
                  marginTop: overlayGap,
                  marginBottom: overlayGap,
                },
              ]}
              onLayout={(event) => {
                stageWidth.value = event.nativeEvent.layout.width;
                stageHeight.value = event.nativeEvent.layout.height;
              }}
            >
              {activePhoto ? (
                <GestureDetector gesture={photoGesture}>
                  <Animated.View collapsable={false} style={[styles.photoFrame, animatedPhotoStyle]}>
                    <View collapsable={false} style={styles.gestureSurface}>
                      <Image source={{ uri: activePhoto }} style={styles.mainImage} />
                    </View>
                  </Animated.View>
                </GestureDetector>
              ) : (
                <View style={styles.emptyState} />
              )}
            </View>
          </View>

          {photos.length > 1 ? (
            <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
              <View style={styles.footer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.thumbnailsContent,
                    photos.length < 5 ? styles.thumbnailsContentCentered : null,
                  ]}
                >
                  {photos.map((photo, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <TouchableOpacity
                        key={`${photo}-${index}`}
                        activeOpacity={0.85}
                        style={[
                          styles.thumbnailButton,
                          isActive ? styles.thumbnailButtonActive : null,
                        ]}
                        onPress={() => setActiveIndex(index)}
                      >
                        <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </SafeAreaView>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: '#000',
    },
    headerSafeArea: {
      zIndex: 3,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.24)',
    },
    header: {
      height: theme.spacing.headerHeight,
      paddingBottom: theme.spacing.sm + 2,
      justifyContent: 'flex-end',
    },
    backButton: {
      minHeight: theme.spacing.iconButtonHeight,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      marginLeft: theme.spacing.screenPaddingHorizontal,
      paddingVertical: 0,
      paddingRight: theme.spacing.sm,
    },
    backLabel: {
      color: '#fff',
      ...theme.typography.bodyBold,
    },
    stageSection: {
      flex: 1,
      width: '100%',
    },
    stage: {
      flex: 1,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoFrame: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gestureSurface: {
      width: '100%',
      height: '100%',
    },
    mainImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    emptyState: {
      flex: 1,
      width: '100%',
    },
    footerSafeArea: {
      zIndex: 3,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(110, 110, 110, 0.24)',
    },
    footer: {
      justifyContent: 'center',
      paddingTop: theme.spacing.md,
    },
    thumbnailsContent: {
      flexGrow: 1,
      paddingHorizontal: 0,
      gap: theme.spacing.sm,
    },
    thumbnailsContentCentered: {
      justifyContent: 'center',
    },
    thumbnailButton: {
      width: theme.spacing.xxxxl + theme.spacing.xxl,
      height: theme.spacing.xxxxl + theme.spacing.xxl,
      borderRadius: theme.spacing.radiusLarge,
      overflow: 'hidden',
      opacity: 0.68,
    },
    thumbnailButtonActive: {
      opacity: 1,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
  });
