import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../themes/theme';

/**
 * Базовые стили для компонентов
 */

export const createComponentStyles = (theme: Theme) => {
  return StyleSheet.create({
    // Карточки
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.radius,
      padding: theme.spacing.cardPadding,
      borderWidth: theme.spacing.borderWidth,
      borderColor: theme.colors.border,
    } as ViewStyle,

    cardElevated: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.radius,
      padding: theme.spacing.cardPadding,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,

    // Кнопки
    button: {
      borderRadius: theme.spacing.radius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.buttonPadding,
      paddingHorizontal: theme.spacing.lg,
    } as ViewStyle,

    buttonPrimary: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    buttonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.spacing.borderWidth,
      borderColor: theme.colors.border,
    } as ViewStyle,

    buttonDisabled: {
      backgroundColor: theme.colors.disabled,
      opacity: 0.6,
    } as ViewStyle,

    buttonText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    } as TextStyle,

    buttonTextSecondary: {
      ...theme.typography.button,
      color: theme.colors.text,
    } as TextStyle,

    // Поля ввода
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.spacing.borderWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.spacing.radius,
      paddingHorizontal: theme.spacing.inputPadding,
      height: theme.spacing.inputHeight,
      ...theme.typography.body,
      color: theme.colors.text,
    } as ViewStyle & TextStyle,

    inputError: {
      borderColor: theme.colors.error,
    } as ViewStyle,

    inputLabel: {
      ...theme.typography.label,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    } as TextStyle,

    inputErrorText: {
      ...theme.typography.captionSmall,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    } as TextStyle,

    // Разделители
    divider: {
      height: theme.spacing.borderWidth,
      backgroundColor: theme.colors.divider,
      marginVertical: theme.spacing.md,
    } as ViewStyle,

    dividerVertical: {
      width: theme.spacing.borderWidth,
      backgroundColor: theme.colors.divider,
      marginHorizontal: theme.spacing.md,
    } as ViewStyle,

    // Заголовки
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    } as TextStyle,

    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    } as TextStyle,

    // Чипы
    chip: {
      borderRadius: theme.spacing.radiusRound,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: theme.spacing.borderWidth,
      borderColor: theme.colors.border,
    } as ViewStyle,

    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    } as ViewStyle,

    chipText: {
      ...theme.typography.caption,
      color: theme.colors.text,
    } as TextStyle,

    chipTextSelected: {
      color: theme.colors.textInverse,
    } as TextStyle,
  });
};
