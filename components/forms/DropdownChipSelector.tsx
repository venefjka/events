import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/themes/useTheme';

export interface DropdownChipItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownChipSelectorProps {
  label?: string;
  value?: string;
  placeholder?: string;
  items: DropdownChipItem[];
  onSelect: (id: string) => void;
  allowClear?: boolean;
  clearLabel?: string;
  minDropdownWidth?: number;
  dropdownPlacement?: 'above' | 'below';
  disabled?: boolean;
  hideSelectedLabelInChip?: boolean;
}

export const DropdownChipSelector: React.FC<DropdownChipSelectorProps> = ({
  label,
  value,
  placeholder = 'Выбрать',
  items,
  onSelect,
  allowClear = true,
  clearLabel = 'Не выбрано',
  minDropdownWidth,
  dropdownPlacement = 'below',
  disabled = false,
  hideSelectedLabelInChip = false,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [dropdownFrame, setDropdownFrame] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const instanceIdRef = useRef(`dropdown-${Math.random().toString(36).slice(2)}`);
  const triggerRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const normalizedItems = useMemo(() => {
    if (!allowClear) {
      return items;
    }
    return [{ id: '', label: clearLabel }, ...items];
  }, [allowClear, clearLabel, items]);

  const selectedItem = useMemo(
    () => normalizedItems.find((item) => item.id === value),
    [normalizedItems, value]
  );
  const hasSelection = Boolean(value);
  const displayLabel = selectedItem?.label ?? placeholder;
  const showChipLabel = !(hideSelectedLabelInChip && hasSelection);

  const windowSize = Dimensions.get('window');
  const availableBelow = dropdownFrame
    ? Math.max(0, windowSize.height - (dropdownFrame.y + dropdownFrame.height) - theme.spacing.xxxl)
    : 0;
  const availableAbove = dropdownFrame
    ? Math.max(0, dropdownFrame.y - theme.spacing.xxxl)
    : 0;
  const showAbove = dropdownPlacement === 'above';
  const maxHeight = dropdownFrame ? Math.min(
    theme.spacing.inputHeight * 6.2,
    showAbove ? availableAbove : availableBelow) : 1;

  const horizontalGutter = theme.spacing.screenPaddingHorizontal;
  const maxDropdownWidth = windowSize.width - horizontalGutter * 2;
  const targetMinWidth = Math.min(
    maxDropdownWidth,
    minDropdownWidth ?? (dropdownFrame?.width ?? 0)
  );
  const dropdownWidth = dropdownFrame
    ? Math.min(maxDropdownWidth, Math.max(dropdownFrame.width, targetMinWidth))
    : 1;
  const dropdownLeft = dropdownFrame
    ? Math.min(
      Math.max(horizontalGutter, dropdownFrame.x),
      windowSize.width - dropdownWidth - horizontalGutter
    )
    : 0;

  const dropdownVerticalPosition = dropdownFrame
    ? showAbove
      ? { bottom: windowSize.height - dropdownFrame.y + theme.spacing.sm }
      : { top: dropdownFrame.y + dropdownFrame.height + theme.spacing.sm }
    : { top: 0 };

  const radius = theme.spacing.inputHeight / 2;
  const overlayOpacity = theme.isDark ? 0.6 : 0.07;

  useEffect(() => {
    const handleActiveChange = (activeId: string) => {
      if (activeId !== instanceIdRef.current) {
        setOpen(false);
      }
    };

    registerDropdownListener(handleActiveChange);
    return () => {
      unregisterDropdownListener(handleActiveChange);
    };
  }, []);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
      setActiveDropdown('');
    }
  }, [disabled, open]);

  const closeDropdown = () => {
    setOpen(false);
    setActiveDropdown('');
  };

  const openDropdown = () => {
    if (disabled) return;
    setActiveDropdown(instanceIdRef.current);
    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        setDropdownFrame({ x, y, width, height });
        setOpen(true);
      });
    });
  };

  return (
    <View style={[styles.wrapper, open && styles.wrapperOpen]}>
      {label ? (
        <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        ref={triggerRef}
        style={[
          styles.chip,
          {
            backgroundColor: disabled ? theme.colors.surfaceVariant : theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.spacing.radiusRound,
            paddingHorizontal: theme.spacing.lg,
            minHeight: theme.spacing.inputHeight,
            paddingVertical: theme.spacing.xs,
          },
          disabled && styles.chipDisabled,
        ]}
        onPress={() => (open ? closeDropdown() : openDropdown())}
        activeOpacity={0.8}
        disabled={disabled}
      >
        {selectedItem?.icon ?? null}
        {showChipLabel ? (
          <Text
            style={{
              ...theme.typography.body,
              color: disabled
                ? theme.colors.textSecondary
                : hasSelection
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {displayLabel}
          </Text>
        ) : null}
        <Ionicons
          name="chevron-down"
          size={theme.spacing.iconSizeSmall}
          color={theme.colors.textSecondary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {open && dropdownFrame ? (
        <Modal transparent visible onRequestClose={closeDropdown}>
          <View style={styles.modalRoot}>
            <Pressable
              style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}
              onPress={closeDropdown}
            />
            <TouchableOpacity
              onPress={closeDropdown}
              activeOpacity={0.9}
              style={[
                styles.chip,
                styles.chipClone,
                {
                  backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.background,
                  borderColor: theme.colors.border,
                  borderRadius: theme.spacing.radiusRound,
                  paddingHorizontal: theme.spacing.lg,
                  height: dropdownFrame.height,
                  left: dropdownFrame.x,
                  top: dropdownFrame.y,
                  width: dropdownFrame.width,
                },
              ]}
            >
              {selectedItem?.icon ?? null}
              {showChipLabel ? (
                <Text
                  style={{
                    ...theme.typography.body,
                    color: hasSelection ? theme.colors.text : theme.colors.textSecondary,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {displayLabel}
                </Text>
              ) : null}
              <Ionicons
                name="chevron-down"
                size={theme.spacing.iconSizeSmall}
                color={theme.colors.textSecondary}
                style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.dropdown,
                {
                  borderColor: theme.colors.border,
                  borderRadius: radius,
                  backgroundColor: theme.colors.background,
                  ...dropdownVerticalPosition,
                  left: dropdownLeft,
                  width: dropdownWidth,
                },
              ]}
            >
              <ScrollView
                style={{ maxHeight: maxHeight }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {normalizedItems.map((item, index) => {
                  const isSelected = item.id === value || (!hasSelection && item.id === '');
                  const isFirst = index === 0;
                  const isLast = index === normalizedItems.length - 1;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        onSelect(item.id);
                        closeDropdown();
                      }}
                      style={[
                        styles.item,
                        {
                          paddingHorizontal: theme.spacing.lg,
                          minHeight: theme.spacing.inputHeight,
                          paddingVertical: theme.spacing.xs,
                          gap: theme.spacing.lg,
                          borderBottomWidth: isLast ? 0 : theme.spacing.borderWidth,
                          borderBottomColor: theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.surface : theme.colors.background,
                          borderTopLeftRadius: isFirst ? radius : 0,
                          borderTopRightRadius: isFirst ? radius : 0,
                          borderBottomLeftRadius: isLast ? radius : 0,
                          borderBottomRightRadius: isLast ? radius : 0,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      {item.icon ?? null}
                      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1,
  },
  wrapperOpen: {
    zIndex: 999,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  chipDisabled: {
    opacity: 0.7,
  },
  dropdown: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 12,
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipClone: {
    position: 'absolute',
    zIndex: 1001,
  },
});

let activeDropdownId = '';
const dropdownListeners = new Set<(id: string) => void>();

const setActiveDropdown = (id: string) => {
  activeDropdownId = id;
  dropdownListeners.forEach((listener) => listener(activeDropdownId));
};

const registerDropdownListener = (listener: (id: string) => void) => {
  dropdownListeners.add(listener);
};

const unregisterDropdownListener = (listener: (id: string) => void) => {
  dropdownListeners.delete(listener);
};
