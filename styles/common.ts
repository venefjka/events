import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../themes/theme';

/**
 * Общие стили для экранов и контейнеров
 */

export const createCommonStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    screenContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingVertical: theme.spacing.screenPaddingVertical,
    } as ViewStyle,

    section: {
      marginBottom: theme.spacing.sectionSpacing,
    } as ViewStyle,

    sectionTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    } as TextStyle,

    row: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,

    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xxl,
    } as ViewStyle,

    emptyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    } as TextStyle,
  });
};
