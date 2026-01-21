import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useEffect } from 'react';
import { Activity, Chat, FilterState, Notification, TimeSegment, User } from '../types';
import { mockActivities } from '../mocks/activities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [selectedTimeSegment, setSelectedTimeSegment] = useState<TimeSegment>('now');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    participantsRange: [1, 10],
    onlyAvailable: false,
    level: [],
    distance: 25,
    gender: 'any',
    ageGroups: [],
    timeSegment: null,
  });
  const [joinedActivities, setJoinedActivities] = useState<string[]>([]);
  const [savedActivities, setSavedActivities] = useState<string[]>([]);
  const [userActivities, setUserActivities] = useState<Record<string, { joined: string[], saved: string[] }>>({});
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [accounts, setAccounts] = useState<User[]>([]);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const [userJson, accountsJson] = await Promise.all([
        AsyncStorage.getItem('currentUser'),
        AsyncStorage.getItem('accounts'),
      ]);
      
      const user = userJson ? JSON.parse(userJson) : null;
      const storedAccounts = accountsJson ? JSON.parse(accountsJson) : [];
      
      return { user, accounts: storedAccounts };
    },
  });

  const loadUserActivitiesQuery = useQuery({
    queryKey: ['userActivities'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('userActivities');
      return stored ? JSON.parse(stored) : {};
    },
  });

  useEffect(() => {
    if (loadUserActivitiesQuery.data) {
      setUserActivities(loadUserActivitiesQuery.data);
    }
  }, [loadUserActivitiesQuery.data]);

  useEffect(() => {
    if (authQuery.data) {
      setCurrentUser(authQuery.data.user);
      setAccounts(authQuery.data.accounts);
      setIsAuthReady(true);
      
      if (authQuery.data.user) {
        const userId = authQuery.data.user.id;
        const userActivitiesData = userActivities[userId] || { joined: [], saved: [] };
        setJoinedActivities(userActivitiesData.joined);
        setSavedActivities(userActivitiesData.saved);
      }
    } else if (authQuery.isError || authQuery.isSuccess) {
      setIsAuthReady(true);
    }
  }, [authQuery.data, authQuery.isError, authQuery.isSuccess, userActivities]);

  const loginMutation = useMutation({
    mutationFn: async (user: User) => {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      const userActivitiesData = userActivities[user.id] || { joined: [], saved: [] };
      setJoinedActivities(userActivitiesData.joined);
      setSavedActivities(userActivitiesData.saved);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (user: User) => {
      const accountsJson = await AsyncStorage.getItem('accounts');
      const existingAccounts = accountsJson ? JSON.parse(accountsJson) : [];
      const updatedAccounts = [...existingAccounts, user];
      
      await Promise.all([
        AsyncStorage.setItem('currentUser', JSON.stringify(user)),
        AsyncStorage.setItem('accounts', JSON.stringify(updatedAccounts)),
      ]);
      
      return { user, accounts: updatedAccounts };
    },
    onSuccess: ({ user, accounts }) => {
      setCurrentUser(user);
      setAccounts(accounts);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem('currentUser');
    },
    onSuccess: () => {
      setCurrentUser(null);
    },
  });

  const switchAccountMutation = useMutation({
    mutationFn: async (user: User) => {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      const userActivitiesData = userActivities[user.id] || { joined: [], saved: [] };
      setJoinedActivities(userActivitiesData.joined);
      setSavedActivities(userActivitiesData.saved);
    },
  });

  const filteredActivities = useMemo(() => {
    if (!currentUser) return [];
    
    return activities.filter((activity) => {
      if (filters.categories.length > 0 && !filters.categories.includes(activity.category.id)) {
        return false;
      }
      
      const currentCount = activity.currentParticipants.length;
      if (currentCount < filters.participantsRange[0] || currentCount > filters.participantsRange[1]) {
        return false;
      }
      
      if (filters.onlyAvailable && currentCount >= activity.maxParticipants) {
        return false;
      }
      
      if (filters.level.length > 0 && !filters.level.includes(activity.level)) {
        return false;
      }

      const timeSegmentToUse = filters.timeSegment || selectedTimeSegment;
      if (timeSegmentToUse) {
        const activityDate = new Date(activity.startTime);
        const now = new Date();
        const hours = activityDate.getHours();
        const isToday = activityDate.toDateString() === now.toDateString();
        const isTomorrow = activityDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        const dayOfWeek = activityDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        switch (timeSegmentToUse) {
          case 'morning':
            return isToday && hours >= 6 && hours < 12;
          case 'afternoon':
            return isToday && hours >= 12 && hours < 17;
          case 'evening':
            return isToday && hours >= 17 && hours < 23;
          case 'now':
            const diffMs = activityDate.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            return diffHours >= 0 && diffHours <= 2;
          case 'night':
            return isToday && (hours >= 23 || hours < 6);
          case 'tomorrow':
            return isTomorrow;
          case 'weekend':
            return isWeekend && activityDate >= now;
          default:
            return true;
        }
      }

      return true;
    });
  }, [activities, filters, selectedTimeSegment, currentUser]);

  const requestJoinActivity = (activityId: string) => {
    if (!currentUser) return;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    if (activity.requiresApproval) {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                pendingRequests: [...a.pendingRequests, currentUser],
              }
            : a
        )
      );
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: 'request',
          title: 'Новый запрос',
          message: `${currentUser.name} хочет присоединиться к "${activity.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          activityId,
          actionRequired: true,
          requestUserId: currentUser.id,
        },
        ...prev,
      ]);
    } else {
      joinActivity(activityId);
    }
  };

  const saveUserActivities = async (userId: string, joined: string[], saved: string[]) => {
    const updated = { ...userActivities, [userId]: { joined, saved } };
    setUserActivities(updated);
    await AsyncStorage.setItem('userActivities', JSON.stringify(updated));
  };

  const joinActivity = (activityId: string) => {
    if (!currentUser) return;
    const updatedJoined = [...joinedActivities, activityId];
    setJoinedActivities(updatedJoined);
    saveUserActivities(currentUser.id, updatedJoined, savedActivities);
    
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              currentParticipants: [...activity.currentParticipants, currentUser],
              pendingRequests: activity.pendingRequests.filter((u) => u.id !== currentUser.id),
            }
          : activity
      )
    );
  };

  const approveJoinRequest = (activityId: string, userId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const user = activity.pendingRequests.find((u) => u.id === userId);
    if (!user) return;

    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              currentParticipants: [...a.currentParticipants, user],
              pendingRequests: a.pendingRequests.filter((u) => u.id !== userId),
            }
          : a
      )
    );

    if (currentUser && userId === currentUser.id) {
      const updatedJoined = [...joinedActivities, activityId];
      setJoinedActivities(updatedJoined);
      saveUserActivities(currentUser.id, updatedJoined, savedActivities);
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.activityId === activityId && n.requestUserId === userId
          ? { ...n, read: true }
          : n
      )
    );
  };

  const rejectJoinRequest = (activityId: string, userId: string) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              pendingRequests: a.pendingRequests.filter((u) => u.id !== userId),
            }
          : a
      )
    );

    setNotifications((prev) =>
      prev.map((n) =>
        n.activityId === activityId && n.requestUserId === userId
          ? { ...n, read: true }
          : n
      )
    );
  };

  const leaveActivity = (activityId: string) => {
    if (!currentUser) return;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const eventTime = new Date(activity.startTime);
    const now = new Date();
    const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 2 && hoursUntilEvent > 0) {
      console.log('Warning: Canceling less than 2 hours before event - rating will be affected');
    }

    const updatedJoined = joinedActivities.filter((id) => id !== activityId);
    setJoinedActivities(updatedJoined);
    saveUserActivities(currentUser.id, updatedJoined, savedActivities);
    
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              currentParticipants: a.currentParticipants.filter(
                (user) => user.id !== currentUser.id
              ),
            }
          : a
      )
    );
  };

  const createActivity = (newActivity: Omit<Activity, 'id' | 'organizer' | 'currentParticipants' | 'pendingRequests'>) => {
    if (!currentUser) return null;
    const activity: Activity = {
      ...newActivity,
      id: Date.now().toString(),
      organizer: currentUser,
      currentParticipants: [currentUser],
      pendingRequests: [],
    };
    setActivities((prev) => [activity, ...prev]);
    const updatedJoined = [...joinedActivities, activity.id];
    setJoinedActivities(updatedJoined);
    saveUserActivities(currentUser.id, updatedJoined, savedActivities);
    return activity;
  };

  const toggleSaveActivity = (activityId: string) => {
    if (!currentUser) return;
    const updatedSaved = savedActivities.includes(activityId)
      ? savedActivities.filter((id) => id !== activityId)
      : [...savedActivities, activityId];
    setSavedActivities(updatedSaved);
    saveUserActivities(currentUser.id, joinedActivities, updatedSaved);
  };

  const markAttendance = (activityId: string, userId: string) => {
    if (!currentUser) return;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const isRegistered = activity.currentParticipants.some((p) => p.id === userId);
    if (!isRegistered) {
      console.log('User not registered for this activity');
      return;
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              attendedUsers: [...a.attendedUsers, userId],
            }
          : a
      )
    );
  };

  const rateActivity = (activityId: string, rating: number, comment?: string) => {
    if (!currentUser) return;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    if (!activity.attendedUsers.includes(currentUser.id)) {
      console.log('Can only rate activities you attended');
      return;
    }

    const activityRating = {
      id: Date.now().toString(),
      userId: currentUser.id,
      activityId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              ratings: [...a.ratings, activityRating],
            }
          : a
      )
    );
  };

  const getUserRating = (userId: string) => {
    const userActivities = activities.filter(
      (a) => a.organizer.id === userId && a.ratings.length > 0
    );

    if (userActivities.length === 0) return 4.5;

    const totalRating = userActivities.reduce((sum, activity) => {
      const avgActivityRating =
        activity.ratings.reduce((s, r) => s + r.rating, 0) / activity.ratings.length;
      return sum + avgActivityRating;
    }, 0);

    return totalRating / userActivities.length;
  };

  return {
    currentUser,
    isAuthReady,
    activities: filteredActivities,
    allActivities: activities,
    selectedTimeSegment,
    setSelectedTimeSegment,
    filters,
    setFilters,
    joinedActivities,
    savedActivities,
    toggleSaveActivity,
    requestJoinActivity,
    joinActivity,
    leaveActivity,
    approveJoinRequest,
    rejectJoinRequest,
    createActivity,
    markAttendance,
    rateActivity,
    getUserRating,
    chats,
    setChats,
    notifications,
    setNotifications,
    login: (user: User) => loginMutation.mutate(user),
    register: (user: User) => registerMutation.mutate(user),
    logout: () => logoutMutation.mutate(),
    switchAccount: (user: User) => switchAccountMutation.mutate(user),
    accounts,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
});
