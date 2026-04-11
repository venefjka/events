import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../ui/Chip';
import { useTheme } from '../../themes/useTheme';
import { ActivityCategory } from '../../types';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';

export interface InterestSelectorProps {
    categories: ActivityCategory[];
    selectedInterests: string[];
    onInterestToggle: (interestId: string) => void;
    expandedCategories?: string[];
    onCategoryToggle?: (categoryId: string) => void;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
    categories,
    selectedInterests,
    onInterestToggle,
    expandedCategories = [],
    onCategoryToggle,
}) => {
    const theme = useTheme();

    return (
        <ScrollView style={[styles.container]} showsVerticalScrollIndicator={false}>
            {categories.map((category) => {
                const isExpanded = expandedCategories.includes(category.id);
                return (
                    <View key={category.id} style={{ marginTop: theme.spacing.lg }}>
                        <TouchableOpacity
                            style={[
                                styles.categoryHeader,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                    borderWidth: theme.spacing.borderWidth / 2,
                                    borderRadius: theme.spacing.radius,
                                    paddingVertical: theme.spacing.md,
                                    paddingHorizontal: theme.spacing.lg,
                                },
                            ]}
                            onPress={() => onCategoryToggle?.(category.id)}
                        >
                            {renderCategoryIcon(category, theme.spacing.iconSizeLarge)}
                            <Text
                                style={{
                                    ...theme.typography.bodyBold,
                                    color: theme.colors.text,
                                    flex: 1,
                                    marginLeft: theme.spacing.md,
                                }}
                            >
                                {category.name}
                            </Text>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View style={[styles.subcategories, { marginTop: theme.spacing.md, }]}>
                                {category.subcategories.map((sub) => {
                                    const isSelected = selectedInterests.includes(sub.id);
                                    return (
                                        <Chip
                                            key={sub.id}
                                            label={sub.name}
                                            selected={isSelected}
                                            onPress={() => onInterestToggle(sub.id)}
                                            variant={'surface'}
                                            size="medium"
                                            style={{
                                                marginRight: theme.spacing.sm, marginBottom: theme.spacing.sm,
                                                borderWidth: theme.spacing.borderWidth / 2,
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        )}
                    </View>
                );
            })}
            <View style={{ height: theme.spacing.lg }}></View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    subcategories: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
