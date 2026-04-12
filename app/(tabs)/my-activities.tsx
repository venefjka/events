import React, { useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, AlarmClock, CircleCheck, CircleUser, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import { useActivities } from '../../contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Activity } from '@/types';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';

import { useMyActivities } from '../../hooks/useMyActivities';
import { Header, HeaderButtons } from '../../components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { useActivityFilters } from '@/contexts/ActivityFiltersContext';
import {
    CategoryFilterSection,
    createDefaultFilters,
    createFilterDraft,
    FilterBottomSheetModal,
    FilterChipsRow,
    FormatFilterSection,
    getFilterProfileContext,
    getFilterSectionTitle,
    ParticipationFilterSection,
    PreferencesFilterSection,
    ScheduleFilterSection,
    type FilterSectionKey,
    useFiltersFormController,
    applySectionDefaults,
} from '@/components/filters';

export default function MyActivitiesScreen() {
    const { currentUser } = useAuth();
    const { allActivities } = useActivities();
    const { getUserActivityIdsByStatus } = useActivityParticipation();
    const { filters, setFilters } = useActivityFilters('my-activities');
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<MyActivitiesTab>('upcoming');
    const [activeFilterSection, setActiveFilterSection] = useState<FilterSectionKey | null>(null);
    const profile = useMemo(() => getFilterProfileContext(currentUser), [currentUser]);
    const [modalFilters, setModalFilters] = useState(() => createFilterDraft(filters, profile));

    const filterController = useFiltersFormController({
        localFilters: modalFilters,
        setLocalFilters: setModalFilters,
        profile,
    });

    const upcomingParticipationActivityIds = useMemo(() => {
        if (!currentUser) {
            return [];
        }

        return getUserActivityIdsByStatus(currentUser.id, ['pending', 'accepted']);
    }, [currentUser, getUserActivityIdsByStatus]);

    const attendedActivityIds = useMemo(() => {
        if (!currentUser) {
            return [];
        }

        return getUserActivityIdsByStatus(currentUser.id, ['attended']);
    }, [currentUser, getUserActivityIdsByStatus]);

    const { displayActivities } = useMyActivities({
        searchQuery,
        allActivities,
        currentUser,
        filters,
        activeTab,
        upcomingParticipationActivityIds,
        attendedActivityIds,
    });

    const openFilterSection = (section: FilterSectionKey) => {
        setModalFilters(createFilterDraft(filters, profile));
        setActiveFilterSection(section);
    };

    const closeFilterSection = () => {
        setActiveFilterSection(null);
    };

    const handleApplyFilterSection = () => {
        if (activeFilterSection === 'format' && !filterController.validateCitySelection()) {
            return;
        }

        const nextFilters = { ...filterController.localFilters };
        setModalFilters(nextFilters);
        setFilters(nextFilters);
        closeFilterSection();
    };

    const handleResetFilterSection = () => {
        if (!activeFilterSection) {
            return;
        }

        const defaults = createDefaultFilters(profile);
        const nextFilters = applySectionDefaults(activeFilterSection, filters, defaults);
        const nextModalFilters = applySectionDefaults(activeFilterSection, modalFilters, defaults);

        setModalFilters(nextModalFilters);
        setFilters(nextFilters);
        filterController.resetUiState(activeFilterSection === 'format' ? Boolean(defaults.selectedCity) : false);
        closeFilterSection();
    };

    const renderActiveFilterSection = () => {
        if (!activeFilterSection) {
            return null;
        }

        switch (activeFilterSection) {
            case 'category':
                return <CategoryFilterSection controller={filterController} />;
            case 'format':
                return <FormatFilterSection controller={filterController} />;
            case 'schedule':
                return <ScheduleFilterSection controller={filterController} />;
            case 'participation':
                return <ParticipationFilterSection controller={filterController} />;
            case 'preferences':
                return <PreferencesFilterSection controller={filterController} />;
            default:
                return null;
        }
    };

    const renderActivityCard = ({ item }: { item: Activity }) => (
        <ActivityCard
            activity={item}
            mode="list"
            showCTA={false}
            onPress={() => router.push(`/activity/${item.id}`)}
        />
    );

    type MyActivitiesTab = 'upcoming' | 'attended' | 'created';

    const tabItems = [
        {
            id: 'upcoming' as const,
            label: 'Предстоящие',
            renderIcon: ({ color, size }: { color: string; size: number }) => <AlarmClock size={size} color={color} />,
        },
        {
            id: 'attended' as const,
            label: 'Посещенные',
            renderIcon: ({ color, size }: { color: string; size: number }) => <CircleCheck size={size} color={color} />,
        },
        {
            id: 'created' as const,
            label: 'Созданные',
            renderIcon: ({ color, size, isActive }: { color: string; size: number; isActive: boolean }) => (
                <CircleUser size={size} color={color} fill={isActive ? theme.colors.primary : 'none'} />
            ),
        },
    ];

    const renderEmptyState = () => {
        let icon = <Sprout size={48} color={theme.colors.textSecondary} />;
        let title = 'Нет предстоящих событий';
        let description = 'Присоединитесь к новому событию, чтобы организовать досуг';

        if (activeTab === 'attended') {
            title = 'Нет посещенных событий';
            description = 'Не забудьте предъявить Ваш QR-код организатору для отметки посещения';
        } else if (searchQuery) {
            title = 'Ничего не найдено';
            description = 'Попробуйте изменить запрос';
        } else if (activeTab === 'created') {
            title = 'Нет созданных событий';
            description = 'Попробуйте организовать новое событие сами';
        }

        return (
            <EmptyState
                icon={icon}
                title={title}
                description={description}
            />
        );
    };

    if (!currentUser) {
        return null;
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.container}>
                <Header
                    title="Мои активности"
                    rightButtons={[
                        HeaderButtons.filter(() => router.push('/filters?scope=my-activities')),
                        HeaderButtons.add(),
                    ]}
                />
                <View style={{ backgroundColor: theme.colors.surface }}>
                    <View style={{
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingVertical: theme.spacing.xs * 2
                    }}>
                        <Input
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Поиск"
                            icon={<Search size={theme.spacing.iconSize} color={theme.colors.textSecondary} />}
                            backgroundColor={{ backgroundColor: theme.colors.background }}
                        />
                    </View>

                    <View style={{ paddingBottom: theme.spacing.lg }}>
                        <FilterChipsRow filters={filters} onPress={openFilterSection} />
                    </View>
                </View>

                <View style={{
                    borderTopColor: theme.colors.border,
                    borderTopWidth: theme.spacing.borderWidth,
                    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                    paddingVertical: theme.spacing.lg,
                }}>
                    <ExpandableTabBar<MyActivitiesTab>
                        items={tabItems}
                        activeId={activeTab}
                        onChange={setActiveTab}
                        circleSize={theme.spacing.iconButtonHeight}
                        iconSize={theme.spacing.iconSize}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <FlatList
                        data={displayActivities}
                        renderItem={renderActivityCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[
                            styles.cardsList,
                            {
                                paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                                gap: theme.spacing.sm,
                                paddingBottom: 100,
                            },
                            displayActivities.length === 0 && styles.emptyList,
                        ]}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>

            <FilterBottomSheetModal
                visible={Boolean(activeFilterSection)}
                title={activeFilterSection ? getFilterSectionTitle(activeFilterSection) : 'Фильтр'}
                onClose={closeFilterSection}
                onApply={handleApplyFilterSection}
                onReset={handleResetFilterSection}
            >
                <View key={activeFilterSection ?? 'closed'}>
                    {renderActiveFilterSection()}
                </View>
            </FilterBottomSheetModal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    cardsList: {
        flexGrow: 1,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
});
