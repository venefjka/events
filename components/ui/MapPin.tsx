import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { buildPinGeometry } from '@/utils/pinGeometry';
import { ActivityCategory } from '@/types';

interface MapPinProps {
  coordinate: { latitude: number; longitude: number };
  category: ActivityCategory;
  badgeCount?: number;
  isCluster?: boolean;
  draggable?: boolean;
  onPress?: () => void;
  onDragEnd?: (event: any) => void;
}

export const MapPin: React.FC<MapPinProps> = ({
  coordinate,
  category,
  badgeCount,
  isCluster = false,
  draggable,
  onPress,
  onDragEnd,
}) => {
  const theme = useTheme();
  const {
    pinWidth,
    pinHeight,
    cx,
    cy,
    apexY,
    pinPath,
    innerRadius,
  } = buildPinGeometry(1);
  const iconSize = theme.spacing.iconSize;
  const anchorX = cx / pinWidth;
  const anchorY = apexY / pinHeight;
  const label = typeof badgeCount === 'number' && badgeCount > 0 ? (badgeCount > 99 ? '99+' : String(badgeCount)) : undefined;
  const showClusterLabel = isCluster || (typeof badgeCount === 'number' && badgeCount > 1);
  const markerThemeKey = theme.isDark ? 'dark' : 'light';

  return (
    <Marker
      key={`${markerThemeKey}-${category.id}-${badgeCount ?? 0}-${isCluster ? 'cluster' : 'single'}`}
      coordinate={coordinate}
      anchor={{ x: anchorX, y: anchorY }}
      onPress={onPress}
      draggable={draggable}
      onDragEnd={onDragEnd}
      tracksViewChanges={false}
    >
      <View
        collapsable={false}
        style={[
          styles.markerContainer,
          { width: pinWidth, height: pinHeight },
        ]}
      >
        <View style={styles.markerPin}>
          <Svg width={pinWidth} height={pinHeight} viewBox={`0 0 ${pinWidth} ${pinHeight}`}>
            <Path d={pinPath} fill={theme.colors.primary} />
            <Circle cx={cx} cy={cy} r={innerRadius} fill={theme.colors.background} />
          </Svg>
          {showClusterLabel ? (
            <View
              style={{
                position: 'absolute',
                top: cy - iconSize / 2,
                left: cx - iconSize / 2,
                width: iconSize,
                height: iconSize,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  styles.clusterLabel,
                  {
                    color: theme.colors.primary,
                    fontSize: theme.typography.captionSmall.fontSize,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          ) : (
            <View
              style={{
                position: 'absolute',
                top: cy - iconSize / 2,
                left: cx - iconSize / 2,
              }}
            >
              {renderCategoryIcon(category, iconSize)}
            </View>
          )}
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  markerPin: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  clusterLabel: {
    textAlign: 'center',
    fontWeight: '700',
  },
});
