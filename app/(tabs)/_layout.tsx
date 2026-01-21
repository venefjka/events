import { Tabs } from "expo-router";
import { Map, User, Bell, } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#999",
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#e5e5e5",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
