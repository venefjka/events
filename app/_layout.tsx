import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivitiesProvider } from "@/contexts/ActivitiesContext";
import { ActivityRatingsProvider } from "@/contexts/ActivityRatingsContext";
import { ActivityParticipationProvider } from "@/contexts/ActivityParticipationContext";
import { QrTokenProvider } from "@/contexts/QrTokenContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext";
import { UserActivityFeedProvider } from "@/contexts/UserActivityFeedContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { ActivityFiltersProvider } from "@/contexts/ActivityFiltersContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
    const { currentUser, isAuthReady } = useAuth();
    const { theme } = useTheme();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthReady) return;

        const inAuthGroup = segments[0] === 'auth' || segments[0] === 'register';

        if (!currentUser && !inAuthGroup) {
            router.replace('/auth');
        } else if (currentUser && inAuthGroup) {
            router.replace('/');
        }
    }, [currentUser, segments, isAuthReady, router]);

    if (!isAuthReady) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar
                barStyle={theme.isDark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
                translucent={false}
            />
            <Stack screenOptions={{ headerBackTitle: "Назад" }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="create-activity" options={{ headerShown: false }} />
                <Stack.Screen
                    name="activity/[id]"
                    options={{
                        presentation: "card",
                          headerShown: false,
                        title: "Активность"
                    }}
                />
                <Stack.Screen
                    name="filters"
                    options={{
                        presentation: "card",
                        headerShown: false,
                        title: "Фильтры"
                    }}
                />
                <Stack.Screen
                    name="user/[id]"
                    options={{
                        presentation: "card",
                        headerShown: false,
                        title: "Профиль"
                    }}
                />
                <Stack.Screen
                    name="qr-scan"
                    options={{
                        presentation: "card",
                        headerShown: false,
                        title: "Сканировать QR"
                    }}
                />
                <Stack.Screen
                    name="subscriptions"
                    options={{
                        presentation: "card",
                        headerShown: false
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider>
                    <AuthProvider>
                        <UsersProvider>
                            <NotificationsProvider>
                                <SubscriptionsProvider>
                                    <UserActivityFeedProvider>
                                        <ActivityFiltersProvider>
                                            <ActivitiesProvider>
                                                <ActivityParticipationProvider>
                                                    <QrTokenProvider>
                                                        <ActivityRatingsProvider>
                                                            <RootLayoutNav />
                                                        </ActivityRatingsProvider>
                                                    </QrTokenProvider>
                                                </ActivityParticipationProvider>
                                            </ActivitiesProvider>
                                        </ActivityFiltersProvider>
                                    </UserActivityFeedProvider>
                                </SubscriptionsProvider>
                            </NotificationsProvider>
                        </UsersProvider>
                    </AuthProvider>
                </ThemeProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
