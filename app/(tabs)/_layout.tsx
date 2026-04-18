import { useTheme } from "@/themes/useTheme";
import { Tabs, usePathname } from "expo-router";
import { Map, User, Bell, ToolCase, QrCode } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
    const theme = useTheme();
    const path = usePathname();
    const isIndex = (path === "/" || path === "/qr");
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.background,
                    borderTopWidth: theme.spacing.borderWidth,
                    borderTopColor: isIndex ? theme.colors.background : theme.colors.borderLight,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.tertiary,
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
                name="my-activities"
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <ToolCase color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="qr"
                options={{
                    title: "",
                    tabBarIcon: ({ color, size }) => <QrCode color={color} size={size} />,
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
