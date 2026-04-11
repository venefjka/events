import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/themes/useTheme';

export type DropdownInputItem = {
  id: string;
  label: string;
};

export interface DropdownInputSelectorProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  suggestions: DropdownInputItem[];
  onSelect: (item: DropdownInputItem) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onDropdownClose?: () => void;
  openOnBlurSuggestions?: boolean;
  maxVisibleItems?: number;
  maxDropdownHeight?: number;
}

export const DropdownInputSelector: React.FC<DropdownInputSelectorProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  autoCapitalize = 'none',
  suggestions,
  onSelect,
  onBlur,
  onFocus,
  onDropdownClose,
  openOnBlurSuggestions = false,
  maxVisibleItems = 5,
  maxDropdownHeight,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [manualClosed, setManualClosed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [frame, setFrame] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const overlayOpacity = theme.isDark ? 0.6 : 0.07;

  useEffect(() => {
    if (manualClosed) {
      setOpen(false);
      return;
    }
    if ((isFocused || openOnBlurSuggestions) && suggestions.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [suggestions.length, manualClosed, isFocused, openOnBlurSuggestions]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        setFrame({ x, y, width, height });
      });
    });
  }, [open]);

  const closeDropdown = () => {
    setManualClosed(true);
    setOpen(false);
    setIsFocused(false);
    onDropdownClose?.();
  };

  return (
    <View style={styles.wrapper} ref={triggerRef}>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        autoCapitalize={autoCapitalize}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onFocus={() => {
          setManualClosed(false);
          setIsFocused(true);
          onFocus?.();
        }}
        rightIcon={
          suggestions.length > 0 ? (
            <Ionicons
              name="chevron-down"
              size={theme.spacing.iconSizeSmall}
              color={theme.colors.textSecondary}
              style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
            />
          ) : undefined
        }
        onRightIconPress={() => {
          if (open) {
            closeDropdown();
          } else if (suggestions.length > 0) {
            setManualClosed(false);
            setOpen(true);
          }
        }}
      />

      {open && frame && !manualClosed && (
        <Modal transparent visible onRequestClose={closeDropdown}>
          <View style={styles.modalRoot}>
            <Pressable
              style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}
              onPress={closeDropdown}
            />

            <View
              style={[
                styles.inputClone,
                {
                  left: frame.x,
                  top: frame.y,
                  width: frame.width,
                },
              ]}
            >
              <Input
                label={label}
                value={value}
                onChangeText={() => {}}
                placeholder={placeholder}
                error={error}
                autoCapitalize={autoCapitalize}
                editable={false}
                rightIcon={
                  <Ionicons
                    name="chevron-down"
                    size={theme.spacing.iconSizeSmall}
                    color={theme.colors.textSecondary}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                }
                onRightIconPress={closeDropdown}
              />
            </View>

            <View
              style={[
                styles.dropdown,
                {
                  top: frame.y + frame.height + theme.spacing.sm,
                  left: frame.x,
                  width: frame.width,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.spacing.radius,
                },
              ]}
            >
              <ScrollView
                style={{
                  maxHeight: Math.min(
                    maxDropdownHeight ?? theme.spacing.inputHeight * maxVisibleItems,
                    Dimensions.get('window').height - (frame.y + frame.height) - theme.spacing.xxxl
                  ),
                }}
              >
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelect(item)}
                    style={{
                      paddingVertical: theme.spacing.sm,
                      paddingHorizontal: theme.spacing.lg,
                      borderBottomWidth:
                        index === suggestions.length - 1 ? 0 : theme.spacing.borderWidth,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 2,
  },
  dropdown: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 3,
    elevation: 8,
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  inputClone: {
    position: 'absolute',
    zIndex: 11,
  },
});
