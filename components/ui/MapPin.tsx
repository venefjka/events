import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/СategoryIcon';
import { buildPinGeometry } from '@/utils/pinGeometry';
import { ActivityCategory } from '@/types';

interface MapPinProps {
  coordinate: { latitude: number; longitude: number };
  category: ActivityCategory;
  badgeCount?: number;
  draggable?: boolean;
  onPress?: () => void;
  onDragEnd?: (event: any) => void;
}

export const MapPin: React.FC<MapPinProps> = ({
  coordinate,
  category,
  badgeCount,
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
    radius,
    apexY,
    pinPath,
    innerRadius,
    badgeOffset,
  } = buildPinGeometry(1);
  const iconSize = theme.spacing.iconSize;
  const badgeSize = 20;
  const anchorX = cx / pinWidth;
  const anchorY = apexY / pinHeight;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: anchorX, y: anchorY }}
      onPress={onPress}
      draggable={draggable}
      onDragEnd={onDragEnd}
    >
      <View
        style={[
          styles.markerContainer,
          { width: pinWidth, height: pinHeight },
        ]}
      >
        <View style={styles.markerPin}
        >
          <Svg width={pinWidth} height={pinHeight} viewBox={`0 0 ${pinWidth} ${pinHeight}`}>
            <Path d={pinPath} fill={theme.colors.primary} />
            <Circle cx={cx} cy={cy} r={innerRadius} fill={theme.colors.background} />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: cy - iconSize / 2,
              left: cx - iconSize / 2,
            }}
          >
            {renderCategoryIcon(category, iconSize)}
          </View>
          {typeof badgeCount === 'number' && badgeCount > 0 && (
            <View
              style={[
                styles.markerBadge,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.spacing.radiusRound,
                  top: cy - radius - badgeOffset,
                  left: cx + radius - badgeOffset,
                  width: badgeSize,
                  height: badgeSize,
                },
              ]}
            >
              <Text
                style={[
                  styles.markerBadgeText,
                  {
                    color: theme.colors.textInverse,
                    fontSize: theme.typography.captionSmall.fontSize,
                  },
                ]}
              >
                {badgeCount}
              </Text>
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
  markerBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBadgeText: {
    fontSize: 10,
  },
});
