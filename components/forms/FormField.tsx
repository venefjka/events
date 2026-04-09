import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Input } from '../ui/Input';
import { useTheme } from '../../themes/useTheme';


export interface FormFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    multiline?: boolean;
    numberOfLines?: number;
    disabled?: boolean;
    style?: ViewStyle;
    backgroundColor?: ViewStyle;
    maxLength?: number;
    onBlur?: () => void;
    onFocus?: () => void;
    onEndEditing?: (text: string) => void;
    autoComplete?: 'off' | 'email' | 'password' | 'name' | 'username';
    textContentType?: 'none' | 'emailAddress' | 'password' | 'username' | 'name' | 'oneTimeCode';
    importantForAutofill?: 'auto' | 'no' | 'noExcludeDescendants' | 'yes' | 'yesExcludeDescendants';
    inputStyle?: TextStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    icon,
    rightIcon,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    multiline = false,
    numberOfLines = 1,
    disabled = false,
    backgroundColor,
    style,
    maxLength,
    onBlur,
    onFocus,
    onEndEditing,
    autoComplete,
    textContentType,
    importantForAutofill,
    inputStyle,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { marginBottom: theme.spacing.lg }, style]}>
            <Input
                label={label}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                error={error}
                icon={icon}
                rightIcon={rightIcon}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                numberOfLines={numberOfLines}
                disabled={disabled}
                backgroundColor={backgroundColor}
                maxLength={maxLength}
                onBlur={onBlur}
                onFocus={onFocus}
                onEndEditing={onEndEditing}
                autoComplete={autoComplete}
                textContentType={textContentType}
                importantForAutofill={importantForAutofill}
                inputStyle={inputStyle}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
});
