import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/themes/useTheme';

const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 700;
const BACKDROP_OPACITY = 0.08;

export interface BottomSheetModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  minHeightRatio?: number;
}

export function BottomSheetModal({
  visible,
  title,
  children,
  onClose,
  footer,
  minHeightRatio = 0.5,
}: BottomSheetModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenHeightRef = useRef(Dimensions.get('window').height);
  const screenHeight = screenHeightRef.current;
  const [isMounted, setIsMounted] = useState(visible);
  const isClosingRef = useRef(false);
  const previousVisibleRef = useRef(visible);

  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  const finishClose = useCallback(
    (notifyParent: boolean) => {
      setIsMounted(false);
      isClosingRef.current = false;
      if (notifyParent) {
        onClose();
      }
    },
    [onClose]
  );

  const requestClose = useCallback(
    (notifyParent = true) => {
      if (isClosingRef.current) {
        return;
      }

      isClosingRef.current = true;
      translateY.value = withTiming(
        screenHeight,
        {
          duration: 220,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(finishClose)(notifyParent);
          }
        }
      );
      backdropOpacity.value = withTiming(0, {
        duration: 180,
        easing: Easing.in(Easing.quad),
      });
    },
    [backdropOpacity, finishClose, translateY]
  );

  useEffect(() => {
    if (visible === previousVisibleRef.current) {
      return;
    }

    previousVisibleRef.current = visible;

    if (visible) {
      setIsMounted(true);
      isClosingRef.current = false;
      translateY.value = screenHeight;
      backdropOpacity.value = 0;
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      });
      return;
    }

    if (isMounted) {
      requestClose(false);
    }
  }, [backdropOpacity, isMounted, requestClose, translateY, visible, screenHeight]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([8, 9999])
    .failOffsetX([-20, 20])
    .onUpdate((event) => {
      const nextTranslateY = Math.max(0, event.translationY);
      const progress = Math.min(nextTranslateY / Math.max(screenHeight * 0.35, 1), 1);
      translateY.value = nextTranslateY;
      backdropOpacity.value = BACKDROP_OPACITY * (1 - progress);
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY) {
        runOnJS(requestClose)(true);
        return;
      }

      translateY.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: 140,
        easing: Easing.out(Easing.quad),
      });
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => requestClose(true)}
    >
      <View style={styles.modalRoot}>
        <Animated.View pointerEvents="none" style={[styles.overlay, backdropAnimatedStyle]} />
        <Pressable style={styles.overlayPressable} onPress={() => requestClose(true)} />

        <View style={styles.sheetHost} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              sheetAnimatedStyle,
              {
                backgroundColor: theme.colors.background,
                borderTopLeftRadius: theme.spacing.radiusXLarge,
                borderTopRightRadius: theme.spacing.radiusXLarge,
                minHeight: screenHeight * minHeightRatio,
              },
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View
                style={[
                  styles.handleArea,
                  {
                    paddingVertical: theme.spacing.md,
                  },
                ]}
              >
                <View
                  style={{
                    alignSelf: 'center',
                    width: 40,
                    height: 4,
                    borderRadius: theme.spacing.radiusRound,
                    backgroundColor: theme.colors.border,
                  }}
                />
              </View>
            </GestureDetector>

            <KeyboardAwareScrollView
              style={styles.content}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.xxl,
              }}
              enableOnAndroid
              extraScrollHeight={-70}
              keyboardShouldPersistTaps="handled"
              enableResetScrollToCoords={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
            >
              {title ? (
                <Text
                  style={{
                    color: theme.colors.text,
                    ...theme.typography.h3,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  {title}
                </Text>
              ) : null}
              {children}
            </KeyboardAwareScrollView>

            {footer ? (
              <View
                style={{
                  borderTopWidth: theme.spacing.borderWidth,
                  borderTopColor: theme.colors.border,
                  paddingBottom: insets.bottom,
                }}
              >
                {footer}
              </View>
            ) : null}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHost: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
  },
  handleArea: {
    width: '100%',
  },
  content: {
    flexShrink: 1,
  },
});
