import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Plus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PhotoViewerModal } from '@/components/ui/PhotoViewerModal';
import { useTheme } from '@/themes/useTheme';

interface PhotoPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  columns?: number;
  label?: string;
  addLabel?: string;
  editLabel?: string;
  onDragStateChange?: (isDragging: boolean) => void;
}

interface PhotoTileProps {
  uri: string;
  index: number;
  columns: number;
  gap: number;
  cellSize: SharedValue<number>;
  positions: SharedValue<Record<string, number>>;
  activeId: SharedValue<string | null>;
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  onDelete: (index: number) => void;
  onPreview: (index: number) => void;
  onDrop: () => void;
  onDragStateChange?: (isDragging: boolean) => void;
  borderRadius: number;
  deleteRadius: number;
}

const PhotoTile: React.FC<PhotoTileProps> = ({
  uri,
  index,
  columns,
  gap,
  cellSize,
  positions,
  activeId,
  startX,
  startY,
  translateX,
  translateY,
  onDelete,
  onPreview,
  onDrop,
  onDragStateChange,
  borderRadius,
  deleteRadius,
}) => {
  const pan = Gesture.Pan()
    .activateAfterLongPress(100)
    .onBegin(() => {
      const currentIndex = positions.value[uri] ?? index;
      const baseX = (currentIndex % columns) * (cellSize.value + gap);
      const baseY = Math.floor(currentIndex / columns) * (cellSize.value + gap);
      startX.value = baseX;
      startY.value = baseY;
      translateX.value = 0;
      translateY.value = 0;
      activeId.value = uri;
      if (onDragStateChange) runOnJS(onDragStateChange)(true);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      const currentX = startX.value + event.translationX;
      const currentY = startY.value + event.translationY;
      const step = cellSize.value + gap;
      const col = Math.floor((currentX + cellSize.value / 2) / step);
      const row = Math.floor((currentY + cellSize.value / 2) / step);
      const maxIndex = Object.keys(positions.value).length - 1;
      const nextIndex = Math.max(0, Math.min(row * columns + col, maxIndex));
      const currentIndex = positions.value[uri] ?? index;
      if (nextIndex !== currentIndex) {
        const keys = Object.keys(positions.value).sort(
          (a, b) => (positions.value[a] ?? 0) - (positions.value[b] ?? 0)
        );
        const fromIndex = keys.indexOf(uri);
        if (fromIndex !== -1) {
          const nextKeys = [...keys];
          nextKeys.splice(fromIndex, 1);
          nextKeys.splice(nextIndex, 0, uri);
          const nextPositions: Record<string, number> = {};
          for (let i = 0; i < nextKeys.length; i += 1) {
            nextPositions[nextKeys[i]] = i;
          }
          positions.value = nextPositions;
        }
      }
    })
    .onEnd(() => {
      runOnJS(onDrop)();
      translateX.value = 0;
      translateY.value = 0;
      activeId.value = null;
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    })
    .onFinalize(() => {
      translateX.value = 0;
      translateY.value = 0;
      activeId.value = null;
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentIndex = positions.value[uri] ?? index;
    const baseX = (currentIndex % columns) * (cellSize.value + gap);
    const baseY = Math.floor(currentIndex / columns) * (cellSize.value + gap);
    const isActive = activeId.value === uri;
    return {
      width: cellSize.value,
      height: cellSize.value,
      borderColor: 'transparent',
      transform: [
        { translateX: isActive ? startX.value + translateX.value : withTiming(baseX) },
        { translateY: isActive ? startY.value + translateY.value : withTiming(baseY) },
        { scale: isActive ? withTiming(1.06) : withTiming(1) },
      ],
      zIndex: isActive ? 2 : 1,
    };
  }, [
    activeId,
    cellSize,
    columns,
    gap,
    index,
    positions,
    startX,
    startY,
    translateX,
    translateY,
    uri,
  ]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.tile, { borderRadius }, animatedStyle]}>
        <Pressable style={styles.previewTap} onPress={() => onPreview(index)}>
          <Image source={{ uri }} style={styles.image} />
        </Pressable>
        <Pressable
          onPress={() => onDelete(index)}
          style={[
            styles.deleteButton,
            { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: deleteRadius },
          ]}
          hitSlop={8}
        >
          <X size={14} color="#fff" />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  value,
  onChange,
  max = 4,
  columns = 4,
  label,
  addLabel = 'Добавить фото',
  onDragStateChange,
}) => {
  const theme = useTheme();
  const gap = theme.spacing.sm;
  const [gridWidth, setGridWidth] = React.useState(0);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const activeId = useSharedValue<string | null>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const cellSize = useSharedValue(0);
  const positions = useSharedValue<Record<string, number>>({});
  const itemsRef = React.useRef<string[]>(value);

  const handlePick = React.useCallback(async () => {
    if (value.length >= max) return;

    const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!existingPermission.granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!requested.granted) {
        return;
      }
    }

    const remaining = Math.max(0, max - value.length);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets?.map((asset) => asset.uri) ?? [];
      const merged = [...value, ...selected.filter((uri) => !value.includes(uri))].slice(0, max);
      onChange(merged);
    }
  }, [max, onChange, value]);

  const handleDelete = React.useCallback(
    (index: number) => {
      const next = value.filter((_, idx) => idx !== index);
      onChange(next);
    },
    [onChange, value]
  );

  React.useEffect(() => {
    itemsRef.current = value;
    const nextPositions: Record<string, number> = {};
    value.forEach((uri, idx) => {
      nextPositions[uri] = idx;
    });
    positions.value = nextPositions;
  }, [positions, value]);

  const totalGap = gap * Math.max(0, columns - 1);
  const cellSizeValue = gridWidth ? (gridWidth - totalGap) / columns : 0;
  React.useEffect(() => {
    cellSize.value = cellSizeValue;
  }, [cellSize, cellSizeValue]);

  const handleDrop = React.useCallback(() => {
    const current = itemsRef.current;
    const next = [...current].sort((a, b) => {
      const posA = positions.value[a] ?? 0;
      const posB = positions.value[b] ?? 0;
      return posA - posB;
    });
    onChange(next);
  }, [onChange, positions]);

  const totalTiles = value.length + (value.length < max ? 1 : 0);
  const rows = totalTiles ? Math.ceil(totalTiles / columns) : 0;
  const gridHeight = cellSizeValue
    ? rows * cellSizeValue + Math.max(0, rows - 1) * gap
    : 0;

  return (
    <View>
      {label ? (
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          {label}
        </Text>
      ) : null}

      {value.length > 0 && (
        <View
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            if (nextWidth !== gridWidth) {
              setGridWidth(nextWidth);
            }
          }}
        >
          {gridWidth > 0 && (
            <View style={[styles.grid, { height: gridHeight }]}>
              {value.map((uri, index) => {
                return (
                  <PhotoTile
                    key={uri}
                    uri={uri}
                    index={index}
                    columns={columns}
                    gap={gap}
                    cellSize={cellSize}
                    positions={positions}
                    activeId={activeId}
                    startX={startX}
                    startY={startY}
                    translateX={translateX}
                    translateY={translateY}
                    onDelete={handleDelete}
                    onPreview={setPreviewIndex}
                    onDrop={handleDrop}
                    onDragStateChange={onDragStateChange}
                    borderRadius={theme.spacing.radius}
                    deleteRadius={theme.spacing.radiusRound}
                  />
                );
              })}
              {value.length < max && (
                <Pressable
                  onPress={handlePick}
                  style={[
                    styles.addTile,
                    {
                      width: cellSizeValue,
                      height: cellSizeValue,
                      borderRadius: theme.spacing.radius,
                      left: (value.length % columns) * (cellSizeValue + gap),
                      top:
                        Math.floor(value.length / columns) * (cellSizeValue + gap),
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Plus size={28} color={theme.colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

      {value.length === 0 && (
        <Button
          title={addLabel}
          onPress={handlePick}
          variant="ghost"
          size="large"
          icon={<Plus size={theme.spacing.iconSizeLarge} color={theme.colors.text} />}
          fullWidth
          style={{
            borderWidth: theme.spacing.borderWidth,
            borderColor: theme.colors.border,
            borderStyle: 'dashed',
          }}
          textStyle={{...theme.typography.bodyBold}}
        />
      )}

      <PhotoViewerModal
        visible={previewIndex !== null}
        photos={value}
        initialIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
    width: '100%',
  },
  addTile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tile: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewTap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
