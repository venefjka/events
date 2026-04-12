import { useMemo } from 'react';
import type { Activity, FilterState, UserRecord } from '@/types';
import { filterActivities } from '@/utils/filterActivities';

type MyActivitiesTab = 'upcoming' | 'attended' | 'created';

interface UseMyActivitiesParams {
  activeTab: MyActivitiesTab;
  allActivities: Activity[];
  attendedActivityIds: string[];
  currentUser: UserRecord | null;
  filters: FilterState;
  searchQuery: string;
  upcomingParticipationActivityIds: string[];
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

export const useMyActivities = ({
  activeTab,
  allActivities,
  attendedActivityIds,
  currentUser,
  filters,
  searchQuery,
  upcomingParticipationActivityIds,
}: UseMyActivitiesParams) => {
  const createdActivities = useMemo(() => {
    if (!currentUser) return [];

    return allActivities.filter((activity) => activity.organizer.id === currentUser.id);
  }, [allActivities, currentUser]);

  const upcomingActivities = useMemo(() => {
    if (!currentUser) return [];

    const now = Date.now();
    const participationIds = new Set(upcomingParticipationActivityIds);

    return allActivities.filter((activity) => {
      const endAt = new Date(activity.endAt || activity.startAt).getTime();
      const isUpcoming = !Number.isNaN(endAt) && endAt >= now;
      const isCreatedByCurrentUser = activity.organizer.id === currentUser.id;
      const isParticipant = participationIds.has(activity.id);

      return activity.status === 'active' && isUpcoming && (isCreatedByCurrentUser || isParticipant);
    });
  }, [allActivities, currentUser, upcomingParticipationActivityIds]);

  const attendedActivities = useMemo(() => {
    const attendedIds = new Set(attendedActivityIds);
    return allActivities.filter((activity) => attendedIds.has(activity.id));
  }, [allActivities, attendedActivityIds]);

  const baseActivities = useMemo(() => {
    switch (activeTab) {
      case 'attended':
        return attendedActivities;
      case 'created':
        return createdActivities;
      default:
        return upcomingActivities;
    }
  }, [activeTab, attendedActivities, createdActivities, upcomingActivities]);

  const filteredActivities = useMemo(() => {
    // TODO(backend): switch each tab to a dedicated query:
    // - upcoming: participation/ownership + active future activities
    // - attended: attended participations
    // - created: organizer activities
    return filterActivities(baseActivities, filters);
  }, [baseActivities, filters]);

  const displayActivities = useMemo(
    () => filteredActivities.filter((activity) => matchesSearch(activity, searchQuery)),
    [filteredActivities, searchQuery]
  );

  return {
    displayActivities,
  };
};
