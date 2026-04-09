﻿import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { Subscription } from '../types';


export const [SubscriptionsProvider, useSubscriptions] = createContextHook(() => {
    const { currentUser } = useAuth();

    const subscriptionsQuery = useQuery({
        queryKey: ['subscriptions', currentUser?.id],
        queryFn: async () => {
            // TODO(backend): GET /subscriptions?userId=...
            // Consider cursor pagination and pinned-only queries.
            if (!currentUser) return [];
            const stored = await AsyncStorage.getItem(`subscriptions-${currentUser.id}`);
            return stored ? JSON.parse(stored) : [];
        },
        enabled: !!currentUser,
    });

    const saveSubscriptionsMutation = useMutation({
        mutationFn: async (subscriptions: Subscription[]) => {
            // TODO(backend): POST/DELETE /subscriptions and PATCH /subscriptions/:id
            // Avoid sending full list; send only changes.
            if (!currentUser) return;
            await AsyncStorage.setItem(
                `subscriptions-${currentUser.id}`,
                JSON.stringify(subscriptions)
            );
        },
        onSuccess: () => {
            subscriptionsQuery.refetch();
        },
    });

    const subscriptions: Subscription[] = subscriptionsQuery.data || [];

    const subscribe = (userId: string) => {
        if (!currentUser || userId === currentUser.id) return;

        const isAlreadySubscribed = subscriptions.some((s: Subscription) => s.userId === userId);
        if (isAlreadySubscribed) return;

        const newSubscription: Subscription = {
            userId,
            subscribedAt: new Date().toISOString(),
            isPinned: false,
        };

        const updatedSubscriptions = [...subscriptions, newSubscription];
        saveSubscriptionsMutation.mutate(updatedSubscriptions);
    };

    const unsubscribe = (userId: string) => {
        if (!currentUser) return;
        const updatedSubscriptions = subscriptions.filter((s: Subscription) => s.userId !== userId);
        saveSubscriptionsMutation.mutate(updatedSubscriptions);
    };

    const togglePin = (userId: string) => {
        if (!currentUser) return;

        const pinnedCount = subscriptions.filter((s: Subscription) => s.isPinned).length;
        const subscription = subscriptions.find((s: Subscription) => s.userId === userId);

        if (!subscription) return;

        if (!subscription.isPinned && pinnedCount >= 5) {
            console.log('Maximum 5 subscriptions can be pinned');
            return;
        }

        const updatedSubscriptions = subscriptions.map((s: Subscription) =>
            s.userId === userId ? { ...s, isPinned: !s.isPinned } : s
        );
        saveSubscriptionsMutation.mutate(updatedSubscriptions);
    };

    const isSubscribed = (userId: string) => {
        return subscriptions.some((s: Subscription) => s.userId === userId);
    };

    const isPinned = (userId: string) => {
        const subscription = subscriptions.find((s: Subscription) => s.userId === userId);
        return subscription?.isPinned || false;
    };

    return {
        subscriptions,
        subscribe,
        unsubscribe,
        togglePin,
        isSubscribed,
        isPinned,
        isLoading: subscriptionsQuery.isLoading,
    };
});


