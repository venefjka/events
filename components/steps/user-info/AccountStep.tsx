import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { FormField } from '../../forms/FormField';
import { Mail, Lock } from 'lucide-react-native';

interface AccountStepProps {
    data: any;
    updateData: (data: any) => void;
    mode?: 'register' | 'edit';
    errors?: Record<string, string>;
    showErrors?: boolean;
}

export const AccountStep: React.FC<AccountStepProps> = ({ data, updateData, mode, errors, showErrors }) => {
    const theme = useTheme();
    const emailError = showErrors ? errors?.email : undefined;
    const passwordError = showErrors ? errors?.password : undefined;
    const confirmPasswordError = showErrors ? errors?.confirmPassword : undefined;

    return (
        <View style={[styles.container, { padding: theme.spacing.screenPaddingHorizontal }]}>

            <View style={{ gap: theme.spacing.md }}>
                <FormField
                    label="Электронная почта"
                    value={data.email || ''}
                    onChangeText={(text) => updateData({ email: text })}
                    placeholder="example@mail.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Mail size={20} color={theme.colors.border} />}
                    disabled={mode === 'edit'}
                    error={emailError}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                />

                <FormField
                    label={mode === 'edit' ? 'Новый пароль' : 'Пароль'}
                    value={data.password || ''}
                    onChangeText={(text) => updateData({ password: text })}
                    placeholder="Минимум 6 символов"
                    secureTextEntry={true}
                    icon={<Lock size={20} color={theme.colors.border} />}
                    error={passwordError}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    importantForAutofill="no"
                    onEndEditing={(text) => {
                        if (!text.trim()) {
                            updateData({ password: '', confirmPassword: '' });
                        }
                    }}
                />

                {mode === 'register' && (
                    <>
                        <FormField
                            label="Подтверждение пароля"
                            value={data.confirmPassword || ''}
                            onChangeText={(text) => updateData({ confirmPassword: text })}
                            placeholder="Повторите пароль"
                            secureTextEntry={true}
                            icon={<Lock size={20} color={theme.colors.border} />}
                            error={confirmPasswordError}
                            autoComplete="off"
                            textContentType="oneTimeCode"
                            importantForAutofill="no"
                            onEndEditing={(text) => {
                                if (!text.trim()) {
                                    updateData({ confirmPassword: '' });
                                }
                            }}
                        />
                        <Text style={{ marginTop: 50 }}>
                            todo : Предложить привязать аккаунт с соц сетей
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
