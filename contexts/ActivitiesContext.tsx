import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo } from 'react';
import { User, Activity, FilterState, TimeSegment } from '../types';
import { mockActivities } from '../mocks/activities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export const [ActivitiesProvider, useActivities] = createContextHook(() => {
    const { currentUser } = useAuth();
    const notificationsContext = typeof useNotifications === 'function' ? useNotifications() : null;
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

    const activitiesQuery = useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem('activities');
            return stored ? JSON.parse(stored) : mockActivities;
        },
    });

    const saveActivitiesMutation = useMutation({
        mutationFn: async (activities: Activity[]) => {
            await AsyncStorage.setItem('activities', JSON.stringify(activities));
            return activities;
        },
        onSuccess: () => {
            activitiesQuery.refetch();
        },
    });

    const activities: Activity[] = activitiesQuery.data || [];

    const userActivitiesQuery = useQuery({
        queryKey: ['userActivities', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { joined: [], saved: [] };
            const stored = await AsyncStorage.getItem(`userActivities-${currentUser.id}`);
            return stored ? JSON.parse(stored) : { joined: [], saved: [] };
        },
        enabled: !!currentUser,
    });

    const saveUserActivitiesMutation = useMutation({
        mutationFn: async ({ joined, saved }: { joined: string[]; saved: string[] }) => {
            if (!currentUser) return;
            await AsyncStorage.setItem(
                `userActivities-${currentUser.id}`,
                JSON.stringify({ joined, saved })
            );
        },
        onSuccess: () => {
            userActivitiesQuery.refetch();
        },
    });

    const joinedActivities = userActivitiesQuery.data?.joined || [];
    const savedActivities = userActivitiesQuery.data?.saved || [];

    const filteredActivities = useMemo(() => {
        if (!currentUser) return [];

        return activities.filter((activity: Activity) => {
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
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const isAlreadyParticipant = activity.currentParticipants.some((p: User) => p.id === currentUser.id);
        const isAlreadyPending = activity.pendingRequests.some((p: User) => p.id === currentUser.id);

        if (isAlreadyParticipant || isAlreadyPending) {
            console.log('Already joined or request pending');
            return;
        }

        if (activity.requiresApproval) {
            const updatedActivities = activities.map((a: Activity) =>
                a.id === activityId
                    ? {
                        ...a,
                        pendingRequests: [...a.pendingRequests, currentUser],
                    }
                    : a
            );
            saveActivitiesMutation.mutate(updatedActivities);

            if (notificationsContext) {
                notificationsContext.addNotification({
                    type: 'request',
                    title: 'Новая заявка',
                    message: `${currentUser.name} хочет присоединиться к вашей активности "${activity.title}"`,
                    activityId: activity.id,
                    userId: activity.organizer.id,
                    actionRequired: true,
                    requestUserId: currentUser.id,
                    activityTitle: activity.title,
                });
            }
        } else {
            joinActivity(activityId);
        }
    };

    const joinActivity = (activityId: string) => {
        if (!currentUser) return;
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const isAlreadyParticipant = activity.currentParticipants.some((p: User) => p.id === currentUser.id);
        if (isAlreadyParticipant) {
            console.log('Already a participant');
            return;
        }

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    currentParticipants: [...a.currentParticipants, currentUser],
                    pendingRequests: a.pendingRequests.filter((u) => u.id !== currentUser.id),
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);
    };

    const approveJoinRequest = (activityId: string, userId: string) => {
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const user = activity.pendingRequests.find((u: User) => u.id === userId);
        if (!user) return;

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    currentParticipants: [...a.currentParticipants, user],
                    pendingRequests: a.pendingRequests.filter((u) => u.id !== userId),
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);

        if (notificationsContext) {
            notificationsContext.addNotification({
                type: 'request_approved',
                title: 'Заявка одобрена',
                message: `Ваша заявка на участие в "${activity.title}" была одобрена!`,
                activityId: activity.id,
                userId: userId,
                activityTitle: activity.title,
            });
        }
    };

    const rejectJoinRequest = (activityId: string, userId: string) => {
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    pendingRequests: a.pendingRequests.filter((u) => u.id !== userId),
                }
                : a
        );
        saveActivitiesMutation.mutate(updatedActivities);

        if (notificationsContext) {
            notificationsContext.addNotification({
                type: 'request_rejected',
                title: 'Заявка отклонена',
                message: `Ваша заявка на участие в "${activity.title}" была отклонена`,
                activityId: activity.id,
                userId: userId,
                activityTitle: activity.title,
            });
        }
    };

    const leaveActivity = async (activityId: string) => {
        if (!currentUser) return;
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const eventTime = new Date(activity.startTime);
        const now = new Date();
        const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilEvent < 2 && hoursUntilEvent > 0) {
            console.log('Canceling less than 2 hours before event - rating will be affected');

            const accountsJson = await AsyncStorage.getItem('accounts');
            const accounts: any[] = accountsJson ? JSON.parse(accountsJson) : [];

            const updatedAccounts = accounts.map((acc) => {
                if (acc.id === currentUser.id) {
                    return {
                        ...acc,
                        attendanceHistory: {
                            ...acc.attendanceHistory,
                            cancelled: acc.attendanceHistory.cancelled + 1,
                        },
                        rating: Math.max(1.0, acc.rating - 0.3),
                    };
                }
                return acc;
            });

            await AsyncStorage.setItem('accounts', JSON.stringify(updatedAccounts));

            const updatedCurrentUser = updatedAccounts.find((acc) => acc.id === currentUser.id);
            if (updatedCurrentUser) {
                await AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
        }

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    currentParticipants: a.currentParticipants.filter(
                        (user) => user.id !== currentUser.id
                    ),
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);
    };

    const createActivity = (newActivity: Omit<Activity, 'id' | 'organizer' | 'currentParticipants' | 'pendingRequests'>) => {
        if (!currentUser) return null;
        const activity: Activity = {
            ...newActivity,
            id: `activity-${Date.now()}`,
            organizer: currentUser,
            currentParticipants: [currentUser],
            pendingRequests: [],
        };

        const updatedActivities = [activity, ...activities];
        saveActivitiesMutation.mutate(updatedActivities);

        return activity;
    };

    const toggleSaveActivity = (activityId: string) => {
        if (!currentUser) return;
        const updatedSaved = savedActivities.includes(activityId)
            ? savedActivities.filter((id: string) => id !== activityId)
            : [...savedActivities, activityId];
        saveUserActivitiesMutation.mutate({ joined: joinedActivities, saved: updatedSaved });
    };

    const cancelJoinRequest = (activityId: string) => {
        if (!currentUser) return;
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    pendingRequests: a.pendingRequests.filter((u) => u.id !== currentUser.id),
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);
    };

    const markAttendance = async (activityId: string, userId: string) => {
        if (!currentUser) return;
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        const isRegistered = activity.currentParticipants.some((p: User) => p.id === userId);
        if (!isRegistered) {
            console.log('User not registered for this activity');
            return;
        }

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    attendedUsers: [...a.attendedUsers, userId],
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);

        const accountsJson = await AsyncStorage.getItem('accounts');
        const accounts: any[] = accountsJson ? JSON.parse(accountsJson) : [];
        const updatedAccounts = accounts.map((acc) => {
            if (acc.id === userId) {
                return {
                    ...acc,
                    attendanceHistory: {
                        ...acc.attendanceHistory,
                        attended: acc.attendanceHistory.attended + 1,
                    },
                };
            }
            return acc;
        });
        await AsyncStorage.setItem('accounts', JSON.stringify(updatedAccounts));

        if (notificationsContext) {
            notificationsContext.addNotification({
                type: 'rate_request',
                title: 'Оцените мероприятие',
                message: `Как прошло мероприятие "${activity.title}"? Оставьте отзыв!`,
                activityId: activity.id,
                userId: userId,
                activityTitle: activity.title,
            });
        }
    };

    const rateActivity = async (activityId: string, rating: number, comment?: string) => {
        if (!currentUser) return;
        const activity = activities.find((a: Activity) => a.id === activityId);
        if (!activity) return;

        if (!activity.attendedUsers.includes(currentUser.id)) {
            console.log('Can only rate activities you attended');
            return;
        }

        const activityRating = {
            id: `rating-${Date.now()}`,
            userId: currentUser.id,
            activityId,
            rating,
            comment,
            timestamp: new Date().toISOString(),
        };

        const updatedActivities = activities.map((a: Activity) =>
            a.id === activityId
                ? {
                    ...a,
                    ratings: [...a.ratings, activityRating],
                }
                : a
        );

        saveActivitiesMutation.mutate(updatedActivities);

        const organizerId = activity.organizer.id;
        const accountsJson = await AsyncStorage.getItem('accounts');
        const accounts: any[] = accountsJson ? JSON.parse(accountsJson) : [];

        const organizerActivities = updatedActivities.filter(
            (a: Activity) => a.organizer.id === organizerId && a.ratings.length > 0
        );

        let newRating = 4.5;
        if (organizerActivities.length > 0) {
            const totalRating = organizerActivities.reduce((sum: number, act: { ratings: any[]; }) => {
                const avgActivityRating =
                    act.ratings.reduce((s, r) => s + r.rating, 0) / act.ratings.length;
                return sum + avgActivityRating;
            }, 0);
            newRating = totalRating / organizerActivities.length;
        }

        const updatedAccounts = accounts.map((acc) => {
            if (acc.id === organizerId) {
                return {
                    ...acc,
                    rating: newRating,
                };
            }
            return acc;
        });

        await AsyncStorage.setItem('accounts', JSON.stringify(updatedAccounts));

        if (organizerId === currentUser.id) {
            const updatedCurrentUser = updatedAccounts.find((acc) => acc.id === currentUser.id);
            if (updatedCurrentUser) {
                await AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
        }
    };

    const getUserRating = (userId: string) => {
        const userActivities = activities.filter(
            (a: Activity) => a.organizer.id === userId && a.ratings.length > 0
        );

        if (userActivities.length === 0) return 4.5;

        const totalRating = userActivities.reduce((sum: number, activity: { ratings: any[]; }) => {
            const avgActivityRating =
                activity.ratings.reduce((s, r) => s + r.rating, 0) / activity.ratings.length;
            return sum + avgActivityRating;
        }, 0);

        return totalRating / userActivities.length;
    };

    return {
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
        cancelJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        createActivity,
        markAttendance,
        rateActivity,
        getUserRating,
    };
});
