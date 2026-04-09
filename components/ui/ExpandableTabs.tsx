import { useTheme } from '@/themes/useTheme';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Text,
  TextStyle,
} from 'react-native';

export type ExpandableTabId = string;

export type ExpandableTabIconProps = {
  isActive: boolean;
  size: number;
  color: string;
};

export type ExpandableTabItem<TId extends ExpandableTabId = ExpandableTabId> = {
  id: TId;
  label: string;
  renderIcon: (args: ExpandableTabIconProps) => React.ReactNode;
};

export type ExpandableTabBarColors = {
  activeBg: string;
  inactiveBg: string;
  activeBorder: string;
  inactiveBorder: string;
  activeIcon: string;
  inactiveIcon: string;
  activeText: string;
};

type Props<TId extends ExpandableTabId> = {
  items: ExpandableTabItem<TId>[];
  activeId: TId;
  onChange: (id: TId) => void;

  gap?: number;
  circleSize?: number;
  iconSize?: number;
  activePillWidth?: number;
  durationMs?: number;

  colors?: ExpandableTabBarColors;

  containerStyle?: ViewStyle;
  pillStyle?: ViewStyle;

  labelTextStyle?: TextStyle;
  labelFontWeight?: TextStyle['fontWeight'];
};

export function ExpandableTabBar<TId extends ExpandableTabId>({
  items,
  activeId,
  onChange,

  gap = 16,
  circleSize = 48,
  iconSize = 20,
  activePillWidth = 0.72,
  durationMs = 220,

  colors,
  containerStyle,
  pillStyle,

  labelTextStyle,
  labelFontWeight = '600',
}: Props<TId>) {
  const theme = useTheme();

  if (!colors) {
    colors = {
      activeBg: theme.colors.primary,
      inactiveBg: theme.colors.surfaceVariant,
      activeBorder: theme.colors.primary,
      inactiveBorder: 'transparent',
      activeIcon: theme.colors.textInverse,
      inactiveIcon: theme.colors.textSecondary,
      activeText: theme.colors.textInverse,
    }
  }
  const [containerWidth, setContainerWidth] = useState(0);

  const widthsRef = useRef<Record<string, Animated.Value>>({});

  const ids = useMemo(() => items.map(i => String(i.id)), [items]);

  useEffect(() => {
    ids.forEach(id => {
      if (!widthsRef.current[id]) {
        widthsRef.current[id] = new Animated.Value(0);
      }
    });
  }, [ids]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== containerWidth) setContainerWidth(w);
  };

  useEffect(() => {
    if (!containerWidth || items.length < 2) return;

    const totalGaps = gap * (items.length - 1);
    const usable = Math.max(0, containerWidth - totalGaps);

    const activeW = usable * activePillWidth;
    const inactiveW = usable * ((1 - activePillWidth) / (items.length - 1));

    const anims = items.map(it => {
      const id = String(it.id);
      const target = it.id === activeId ? activeW : inactiveW;
      const v = widthsRef.current[id];
      return Animated.timing(v, {
        toValue: target,
        duration: durationMs,
        useNativeDriver: false,
      });
    });

    Animated.parallel(anims).start();
  }, [activeId, containerWidth, gap, durationMs, items]);

  // label opacity (одна анимация, а не 3)
  const labelProgress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    // лёгкий "перезапуск" появления текста при смене активной вкладки
    labelProgress.setValue(0);
    Animated.timing(labelProgress, {
      toValue: 1,
      duration: Math.max(140, Math.floor(durationMs * 0.8)),
      useNativeDriver: true,
    }).start();
  }, [activeId, durationMs, labelProgress]);

  const labelOpacity = labelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const labelTranslateX = labelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View onLayout={onLayout} style={[styles.container, containerStyle]}>
      <View style={[styles.row, { gap }]}>
        {items.map(it => {
          const isActive = it.id === activeId;
          const widthAnim = widthsRef.current[String(it.id)] ?? new Animated.Value(0);

          const bg = isActive ? colors.activeBg : colors.inactiveBg;
          const borderColor = isActive ? colors.activeBorder : colors.inactiveBorder;
          const iconColor = isActive ? colors.activeIcon : colors.inactiveIcon;

          return (
            <TouchableOpacity key={String(it.id)} activeOpacity={0.85} onPress={() => onChange(it.id)}>
              <Animated.View
                style={[
                  styles.pill,
                  {
                    width: widthAnim,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: bg,
                    borderColor,
                    borderWidth: isActive ? 2 : 1,
                    justifyContent: 'center',
                  },
                  pillStyle,
                ]}
              >

                <View style={[styles.iconSlot, { width: circleSize, height: circleSize }]}>
                  {it.renderIcon({ isActive, size: iconSize, color: iconColor })}
                </View>

                {isActive && (
                  <Animated.View style={{ opacity: labelOpacity, transform: [{ translateX: labelTranslateX }] }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.label,
                        labelTextStyle,
                        {
                          fontWeight: labelFontWeight,
                          color: colors.activeText,
                        },
                      ]}
                    >
                      {it.label}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingRight: 12,
  },
});
