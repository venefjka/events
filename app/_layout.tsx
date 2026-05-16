import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ApiError } from "@/api/client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityFiltersProvider } from "@/contexts/ActivityFiltersContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
                if (error instanceof ApiError) {
                    if (error.status >= 400 && error.status < 500) {
                        return false;
                    }

                    return failureCount < 2;
                }

                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});

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
                <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
                <Stack.Screen name="activity/create" options={{ headerShown: false }} />
                <Stack.Screen name="activity/[id]/edit" options={{ headerShown: false }} />
                <Stack.Screen name="activity/[id]/duplicate" options={{ headerShown: false }} />
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
                        <ActivityFiltersProvider>
                            <RootLayoutNav />
                        </ActivityFiltersProvider>
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
