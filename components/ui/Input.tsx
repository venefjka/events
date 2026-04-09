import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface InputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    multiline?: boolean;
    numberOfLines?: number;
    disabled?: boolean;
    editable?: boolean;
    style?: ViewStyle;
    inputStyle?: TextStyle;
    backgroundColor?: ViewStyle;
    maxLength?: number;
    onBlur?: () => void;
    onFocus?: () => void;
    onEndEditing?: (text: string) => void;
    autoComplete?: 'off' | 'email' | 'password' | 'name' | 'username';
    textContentType?: 'none' | 'emailAddress' | 'password' | 'username' | 'name' | 'oneTimeCode';
    importantForAutofill?: 'auto' | 'no' | 'noExcludeDescendants' | 'yes' | 'yesExcludeDescendants';
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
    value,
    onChangeText,
    placeholder,
    label,
    error,
    icon,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    multiline = false,
    numberOfLines = 1,
    disabled = false,
    editable,
    style,
    inputStyle,
    backgroundColor,
    maxLength,
    onBlur,
    onFocus,
    onEndEditing,
    autoComplete,
    textContentType,
    importantForAutofill,
    rightIcon,
    onRightIconPress,
}) => {
    const theme = useTheme();

    const isEditable = editable ?? !disabled;

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={{ ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: error ? theme.colors.error : theme.colors.border,
                        borderWidth: theme.spacing.borderWidth,
                        borderRadius: theme.spacing.radius,
                        paddingHorizontal: theme.spacing.inputPadding,
                        height: multiline ? (theme.spacing.inputHeight - 2 * theme.spacing.inputPadding) * numberOfLines + 2 * theme.spacing.inputPadding : theme.spacing.inputHeight,
                        // minHeight: multiline ? (theme.spacing.inputHeight - 2 * theme.spacing.inputPadding) * numberOfLines + 2 * theme.spacing.inputPadding : undefined,
                    }, backgroundColor,
                    disabled && { backgroundColor: theme.colors.surfaceVariant, opacity: 0.6 },
                ]}
            >
                {icon && <View style={{ marginRight: theme.spacing.md, alignSelf: 'center' }}>{icon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: theme.colors.text,
                            fontSize: theme.typography.body.fontSize,
                            flex: 1,
                            paddingVertical: multiline ? theme.spacing.inputPadding : 0
                        },
                        inputStyle,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    editable={isEditable}
                    maxLength={maxLength}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    onEndEditing={(event) => onEndEditing?.(event.nativeEvent.text)}
                    autoComplete={autoComplete}
                    textContentType={textContentType}
                    importantForAutofill={importantForAutofill}

                />
                {rightIcon && (
                    <View style={{ marginLeft: theme.spacing.md, alignSelf: 'center' }}>
                        {onRightIconPress ? (
                            <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7}>
                                {rightIcon}
                            </TouchableOpacity>
                        ) : (
                            rightIcon
                        )}
                    </View>
                )}
            </View>
            {error && (
                <Text style={[styles.error, { color: theme.colors.error, marginTop: theme.spacing.xs }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
    },
    input: {
        padding: 0,
    },
    error: {
        fontSize: 13,
    },
});
