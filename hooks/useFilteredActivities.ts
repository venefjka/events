import { useMemo } from 'react';
import { Activity, UserRecord } from '../types';

interface UseFilteredActivitiesProps {
    searchQuery: string;
    activities: Activity[];
    allActivities: Activity[];
    savedActivities: string[];
    currentUser: UserRecord | null;
    activeTab: 'all' | 'recommended' | 'saved';
}

export const useFilteredActivities = ({
    searchQuery,
    activities,
    allActivities,
    savedActivities,
    currentUser,
    activeTab,
}: UseFilteredActivitiesProps) => {
    const filteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) {
            return activities;
        }

        const query = searchQuery.toLowerCase();
        return activities.filter(
            (activity: Activity) =>
                activity.title.toLowerCase().includes(query) ||
                activity.description.toLowerCase().includes(query) ||
                activity.category.name.toLowerCase().includes(query) ||
                activity.location.address.toLowerCase().includes(query)
        );
    }, [searchQuery, activities]);

    const recommendedActivities = useMemo(() => {
        if (!currentUser) return [];
        return allActivities
            .filter((activity: Activity) => {
                if (!filteredBySearch.find((a: Activity) => a.id === activity.id)) return false;

                const hasMatchingInterest = Boolean(
                    activity.subcategoryId &&
                    currentUser.interests.some((interestId: string) => interestId === activity.subcategoryId)
                );
                const matchesLevel =
                    activity.preferences?.level === 'beginner' ||
                    activity.preferences?.level === 'intermediate';
                return hasMatchingInterest || matchesLevel;
            })
            .slice(0, 10);
    }, [allActivities, currentUser, filteredBySearch]);

    const savedActivitiesList = useMemo(() => {
        return filteredBySearch.filter((a: Activity) => savedActivities.includes(a.id));
    }, [filteredBySearch, savedActivities]);

    const displayActivities = useMemo(() => {
        switch (activeTab) {
            case 'recommended':
                return recommendedActivities;
            case 'saved':
                return savedActivitiesList;
            default:
                return filteredBySearch;
        }
    }, [activeTab, recommendedActivities, savedActivitiesList, filteredBySearch]);

    return {
        filteredBySearch,
        recommendedActivities,
        savedActivitiesList,
        displayActivities,
    };
};
