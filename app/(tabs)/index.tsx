import React, { useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    FlatList,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, Star, Sprout, Asterisk } from 'lucide-react-native';
import { router } from 'expo-router';
import { useActivities } from '../../contexts/ActivitiesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Activity } from '@/types';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import Constants from 'expo-constants';

import { useExploreAnimations } from '../../hooks/useExploreAnimations';
import { useExploreActivities } from '../../hooks/useExploreActivities';
import { MapSection } from '../../components/MapSection';
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

export default function ExploreScreen() {
    const { currentUser } = useAuth();
    const { savedActivities, allActivities } = useActivities();
    const { filters, setFilters } = useActivityFilters('explore');
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ExploreTab>('all');
    const [activeFilterSection, setActiveFilterSection] = useState<FilterSectionKey | null>(null);
    const profile = useMemo(() => getFilterProfileContext(currentUser), [currentUser]);
    const [modalFilters, setModalFilters] = useState(() => createFilterDraft(filters, profile));

    const headerHeight = theme.spacing.headerHeight + Constants.statusBarHeight;
    const { isMapExpanded, mapHeight, cardsTop, toggleMapHeight } = useExploreAnimations({ headerHeight });
    const filterController = useFiltersFormController({
        localFilters: modalFilters,
        setLocalFilters: setModalFilters,
        profile,
    });

    const { displayActivities } = useExploreActivities({
        searchQuery,
        allActivities,
        savedActivities,
        currentUser,
        filters,
        activeTab,
    });

    const handleMarkerPress = (activityId: string) => {
        setSelectedMarkerId(activityId);
        if (!isMapExpanded) {
            toggleMapHeight();
        }
    };

    const handleClosePreview = () => {
        setSelectedMarkerId(null);
    };

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

    type ExploreTab = 'all' | 'recommended' | 'saved';

    const tabItems = [
        {
            id: 'all' as const,
            label: 'Все активности',
            renderIcon: ({ color, size }: { color: string; size: number }) => <Asterisk size={size * 1.2} color={color} />,
        },
        {
            id: 'recommended' as const,
            label: 'Рекомендуем для Вас',
            renderIcon: ({ color, size }: { color: string; size: number }) => <Star size={size} color={color} />,
        },
        {
            id: 'saved' as const,
            label: 'Вы сохранили',
            renderIcon: ({ color, size, isActive }: { color: string; size: number; isActive: boolean }) => (
                <Bookmark size={size} color={color} fill={isActive ? theme.colors.primary : 'none'} />
            ),
        },
    ];

    const renderEmptyState = () => {
        let icon = <Sprout size={theme.spacing.iconSizeXXLarge} />;
        let title = 'Нет событий';
        let description = 'Попробуйте изменить фильтры или станьте первым, кто создаст новое событие';

        if (activeTab === 'saved') {
            icon = <Bookmark size={theme.spacing.iconSizeXXLarge} />
            title = 'Нет сохраненных событий';
            description = 'Сохраняйте интересные события, чтобы вернуться к ним позже';
        } else if (searchQuery) {
            icon = <Search size={theme.spacing.iconSizeXXLarge} />
            title = 'Ничего не найдено';
            description = 'Попробуйте изменить запрос';
        } else if (activeTab === 'recommended') {
            icon = <Star size={theme.spacing.iconSizeXXLarge} />
            title = 'Нет рекомендаций';
            description = 'Заполните интересы в профиле, чтобы получать персональные рекомендации';
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
        <View style={[commonStyles.container]}>
            <SafeAreaView edges={['top']} style={[styles.safeArea]}>
                <Header
                    title="WeDo"
                    rightButtons={[
                        HeaderButtons.filter(() => router.push('/filters?scope=explore')),
                        HeaderButtons.add(),
                    ]}
                />
            </SafeAreaView>

            <MapSection
                activities={displayActivities}
                isMapExpanded={isMapExpanded}
                mapHeight={mapHeight}
                selectedMarkerId={selectedMarkerId}
                centerLatitude={filters.selectedCity?.latitude}
                centerLongitude={filters.selectedCity?.longitude}
                onMarkerPress={handleMarkerPress}
                onClosePreview={handleClosePreview}
                onToggleExpand={toggleMapHeight}
            />

            {/* temp fix - map animation */}
            <View style={{ backgroundColor: theme.colors.background, position: 'absolute', top: 0, height: Constants.statusBarHeight + 10, zIndex: 1000, width: '100%' }}></View>

            <View style={[styles.searchWrapper, {
                marginHorizontal: theme.spacing.screenPaddingHorizontal,
                marginVertical: theme.spacing.md,
                top: headerHeight + theme.spacing.xs,
            }]}>
                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Поиск"
                    icon={<Search size={theme.spacing.iconSize} color={theme.colors.textSecondary} />}
                    backgroundColor={{ backgroundColor: theme.colors.background }}
                />
            </View>

            <View style={[styles.filtersRowWrapper, {
                top: headerHeight + theme.spacing.inputHeight + theme.spacing.md * 2,
            }]}>
                <FilterChipsRow filters={filters} onPress={openFilterSection} />
            </View>

            <Animated.View style={[styles.cardsContainer, { top: cardsTop, backgroundColor: theme.colors.background }]}>

                <View style={{
                    borderTopColor: theme.colors.border,
                    borderTopWidth: theme.spacing.borderWidth,
                    paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                    paddingVertical: theme.spacing.lg,
                    backgroundColor: theme.colors.background,
                }}>
                    <ExpandableTabBar<ExploreTab>
                        items={tabItems}
                        activeId={activeTab}
                        onChange={setActiveTab}
                        circleSize={theme.spacing.iconButtonHeight}
                        iconSize={theme.spacing.iconSize}
                    />
                </View>

                <ScrollView style={styles.cardsScroll}>
                    {displayActivities.length > 0 ? (
                        <FlatList
                            data={displayActivities}
                            renderItem={renderActivityCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={[{
                                paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                                gap: theme.spacing.sm,
                                paddingBottom: 100,
                            }]}
                        />
                    ) : (
                        renderEmptyState()
                    )}
                </ScrollView>
            </Animated.View>

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
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filtersRowWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 5,
    },
    cardsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    cardsScroll: {
        flex: 1,
    },
});
