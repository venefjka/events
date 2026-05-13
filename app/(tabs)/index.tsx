import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import Constants from 'expo-constants';

import { useExploreAnimations } from '../../hooks/useExploreAnimations';
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
import { toActivityListQuery } from '@/components/filters/toActivityListQuery';
import { useActivitiesList } from '@/hooks/queries/useActivitiesList';
import { useRecommendedActivities } from '@/hooks/queries/useRecommendedActivities';
import { useSavedActivities } from '@/hooks/queries/useSavedActivities';
import { ActivityCardModel } from '@/types';

type ExploreTab = 'all' | 'recommended' | 'saved';

export default function ExploreScreen() {
    const { currentUser } = useAuth();
    const { filters, setFilters } = useActivityFilters('explore');
    const theme = useTheme();
    const commonStyles = createCommonStyles(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<ExploreTab>('all');
    const [activeFilterSection, setActiveFilterSection] = useState<FilterSectionKey | null>(null);
    const profile = useMemo(() => getFilterProfileContext(currentUser), [currentUser]);
    const [modalFilters, setModalFilters] = useState(() => createFilterDraft(filters, profile));
    const activityQueryParams = useMemo(
        () => toActivityListQuery(filters, 50, searchQuery),
        [filters, searchQuery]
    );
    const listQuery = useActivitiesList(activityQueryParams, activeTab === 'all');
    const recommendedQuery = useRecommendedActivities(activityQueryParams, activeTab === 'recommended');
    const savedQuery = useSavedActivities(activityQueryParams, activeTab === 'saved');
    const areFiltersAvailable = activeTab === 'all';
    const controlsTranslateY = useRef(new Animated.Value(0)).current;

    const headerHeight = theme.spacing.headerHeight + Constants.statusBarHeight;
    const controlsHiddenOffset = -(
        theme.spacing.inputHeight +
        theme.spacing.iconButtonHeight +
        theme.spacing.md * 3
    );
    const { isMapExpanded, mapHeight, cardsTop, toggleMapHeight } = useExploreAnimations({ headerHeight });
    const filterController = useFiltersFormController({
        localFilters: modalFilters,
        setLocalFilters: setModalFilters,
        profile,
    });

    const sourceActivities = useMemo(() => {
        switch (activeTab) {
            case 'recommended':
                return recommendedQuery.data?.items ?? [];
            case 'saved':
                return savedQuery.data?.items ?? [];
            default:
                return listQuery.data?.items ?? [];
        }
    }, [activeTab, listQuery.data?.items, recommendedQuery.data?.items, savedQuery.data?.items]);

    const displayActivities = sourceActivities;

    useEffect(() => {
        Animated.timing(controlsTranslateY, {
            toValue: areFiltersAvailable ? 0 : controlsHiddenOffset,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [areFiltersAvailable, controlsHiddenOffset, controlsTranslateY]);

    const controlsAnimatedStyle = useMemo(
        () => ({
            transform: [{ translateY: controlsTranslateY }],
        }),
        [controlsTranslateY]
    );

    const handleMarkerPress = useCallback(() => {
        if (!isMapExpanded) {
            toggleMapHeight();
        }
    }, [isMapExpanded, toggleMapHeight]);

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

    const renderActivityCard = ({ item }: { item: ActivityCardModel }) => (
        <ActivityCard
            activity={item}
            mode="list"
            showCTA={false}
            onPress={() => router.push(`/activity/${item.id}`)}
        />
    );

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
            icon = <Bookmark size={theme.spacing.iconSizeXXLarge} />;
            title = 'Нет сохраненных событий';
            description = 'Сохраняйте интересные события, чтобы вернуться к ним позже';
        } else if (searchQuery) {
            icon = <Search size={theme.spacing.iconSizeXXLarge} />;
            title = 'Ничего не найдено';
            description = 'Попробуйте изменить запрос';
        } else if (activeTab === 'recommended') {
            icon = <Star size={theme.spacing.iconSizeXXLarge} />;
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
                        ...(areFiltersAvailable ? [HeaderButtons.filter(() => router.push('/filters?scope=explore'))] : []),
                        HeaderButtons.add(),
                    ]}
                />
            </SafeAreaView>

            <MapSection
                activities={displayActivities}
                isMapExpanded={isMapExpanded}
                mapHeight={mapHeight}
                centerLatitude={filters.selectedCity?.latitude}
                centerLongitude={filters.selectedCity?.longitude}
                onMarkerPress={handleMarkerPress}
                onToggleExpand={toggleMapHeight}
            />

            {/* temp fix - map animation */}
            <View style={{ backgroundColor: theme.colors.background, position: 'absolute', top: 0, height: Constants.statusBarHeight + 10, zIndex: 1000, width: '100%' }}></View>

            <Animated.View
                pointerEvents={areFiltersAvailable ? 'auto' : 'none'}
                style={[styles.searchWrapper, controlsAnimatedStyle, {
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
            </Animated.View>

            <Animated.View
                pointerEvents={areFiltersAvailable ? 'auto' : 'none'}
                style={[styles.filtersRowWrapper, controlsAnimatedStyle, {
                top: headerHeight + theme.spacing.inputHeight + theme.spacing.md * 2,
            }]}>
                <FilterChipsRow filters={filters} onPress={openFilterSection} />
            </Animated.View>

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

                <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false}>
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
                titleSecondary='начала события'
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
