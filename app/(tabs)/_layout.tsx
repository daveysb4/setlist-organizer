import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

export default function TabLayout() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme === "dark" ? "#101319" : palette.background,
        },
        headerTitleStyle: {
          color: palette.text,
          fontWeight: "700",
        },
        headerTintColor: palette.text,
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/modal")}
            style={{ marginRight: 16, paddingVertical: 6, paddingHorizontal: 10 }}
          >
            <Text style={{ fontWeight: "700", color: palette.text }}>
              Settings
            </Text>
          </Pressable>
        ),
        tabBarStyle: {
          backgroundColor: theme === "dark" ? "#101319" : palette.background,
          borderTopColor: theme === "dark" ? "#232833" : "#d9d9d9",
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          headerTitle: "Library",
        }}
      />
      <Tabs.Screen
        name="setlists"
        options={{
          title: "Setlists",
          headerTitle: "Setlists",
        }}
      />
    </Tabs>
  );
}