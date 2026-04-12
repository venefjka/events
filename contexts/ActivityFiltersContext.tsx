import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useMemo, useState } from 'react';
import type { FilterState } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createDefaultFilters, getFilterProfileContext } from '@/components/filters/helpers';

export type ActivityFilterScope = 'explore' | 'my-activities';

type FilterScopeState = Record<ActivityFilterScope, FilterState>;

const buildInitialState = (
  profile?: Parameters<typeof createDefaultFilters>[0]
): FilterScopeState => ({
  explore: createDefaultFilters(profile),
  'my-activities': createDefaultFilters(profile),
});

export const [ActivityFiltersProvider, useActivityFiltersStore] = createContextHook(() => {
  const { currentUser } = useAuth();
  const profile = useMemo(() => getFilterProfileContext(currentUser), [currentUser]);
  const [filtersByScope, setFiltersByScope] = useState<FilterScopeState>(() => buildInitialState(profile));

  useEffect(() => {
    setFiltersByScope((prev) => {
      let changed = false;
      const nextState = { ...prev };

      (Object.keys(prev) as ActivityFilterScope[]).forEach((scope) => {
        const currentFilters = prev[scope];
        if (currentFilters.format !== 'offline') {
          return;
        }
        if (currentFilters.selectedCity || currentFilters.cityQuery?.trim()) {
          return;
        }

        nextState[scope] = createDefaultFilters(profile);
        changed = true;
      });

      return changed ? nextState : prev;
    });
  }, [profile]);

  const setScopeFilters = (
    scope: ActivityFilterScope,
    nextFilters: FilterState | ((prev: FilterState) => FilterState)
  ) => {
    setFiltersByScope((prev) => ({
      ...prev,
      [scope]: typeof nextFilters === 'function' ? nextFilters(prev[scope]) : nextFilters,
    }));
  };

  const resetScopeFilters = (scope: ActivityFilterScope) => {
    setScopeFilters(scope, createDefaultFilters(profile));
  };

  return {
    filtersByScope,
    setScopeFilters,
    resetScopeFilters,
  };
});

export const useActivityFilters = (scope: ActivityFilterScope) => {
  const { filtersByScope, setScopeFilters, resetScopeFilters } = useActivityFiltersStore();

  return {
    filters: filtersByScope[scope],
    setFilters: (nextFilters: FilterState | ((prev: FilterState) => FilterState)) =>
      setScopeFilters(scope, nextFilters),
    resetFilters: () => resetScopeFilters(scope),
  };
};
