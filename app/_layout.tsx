import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivitiesProvider } from "@/contexts/ActivitiesContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { currentUser, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthReady) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'register' || segments[0] === 'onboarding';

    if (!currentUser && !inAuthGroup) {
      router.replace('/auth');
    } else if (currentUser && inAuthGroup) {
      router.replace('/');
    }
  }, [currentUser, segments, isAuthReady, router]);

  if (!isAuthReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Назад" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen 
        name="activity/[id]" 
        options={{ 
          presentation: "card",
          headerShown: true,
          title: "Активность"
        }} 
      />
      <Stack.Screen 
        name="create-activity" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          title: "Создать активность"
        }} 
      />
      <Stack.Screen 
        name="filters" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          title: "Фильтры"
        }} 
      />
      <Stack.Screen 
        name="user/[id]" 
        options={{ 
          presentation: "card",
          headerShown: true,
          title: "Профиль"
        }} 
      />
      <Stack.Screen 
        name="qr-scan" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          title: "Сканировать QR"
        }} 
      />
      <Stack.Screen 
        name="rate-activity" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          title: "Оценить событие"
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
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NotificationsProvider>
            <SubscriptionsProvider>
              <ActivitiesProvider>
                <RootLayoutNav />
              </ActivitiesProvider>
            </SubscriptionsProvider>
          </NotificationsProvider>
        </AuthProvider>
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
