import { useMemo } from 'react';
import type { Activity, FilterState, UserRecord } from '@/types';
import { filterActivities } from '@/utils/filterActivities';

type ExploreTab = 'all' | 'recommended' | 'saved';

interface UseExploreActivitiesParams {
  activeTab: ExploreTab;
  allActivities: Activity[];
  currentUser: UserRecord | null;
  filters: FilterState;
  savedActivities: string[];
  searchQuery: string;
}

const matchesSearch = (activity: Activity, searchQuery: string) => {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return (
    activity.title.toLowerCase().includes(query) ||
    activity.description.toLowerCase().includes(query) ||
    activity.category.name.toLowerCase().includes(query) ||
    activity.location.address.toLowerCase().includes(query)
  );
};

export const useExploreActivities = ({
  activeTab,
  allActivities,
  currentUser,
  filters,
  savedActivities,
  searchQuery,
}: UseExploreActivitiesParams) => {
  const filteredActivities = useMemo(() => {
    // TODO(backend): replace local filtering with a list query keyed by screen scope + filter params.
    return filterActivities(allActivities, filters);
  }, [allActivities, filters]);

  const filteredBySearch = useMemo(
    () => filteredActivities.filter((activity) => matchesSearch(activity, searchQuery)),
    [filteredActivities, searchQuery]
  );

  const recommendedActivities = useMemo(() => {
    if (!currentUser) return [];

    return filteredBySearch
      .filter((activity) => {
        const hasMatchingInterest = Boolean(
          activity.subcategoryId &&
            currentUser.interests.some((interestId) => interestId === activity.subcategoryId)
        );
        return hasMatchingInterest;
      })
      .slice(0, 10);
  }, [currentUser, filteredBySearch]);

  const savedActivitiesList = useMemo(
    () => filteredBySearch.filter((activity) => savedActivities.includes(activity.id)),
    [filteredBySearch, savedActivities]
  );

  const displayActivities = useMemo(() => {
    switch (activeTab) {
      case 'recommended':
        return recommendedActivities;
      case 'saved':
        return savedActivitiesList;
      default:
        return filteredBySearch;
    }
  }, [activeTab, filteredBySearch, recommendedActivities, savedActivitiesList]);

  return {
    displayActivities,
    filteredBySearch,
    recommendedActivities,
    savedActivitiesList,
  };
};
