import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ThemePreferenceProvider } from "@/components/theme-preference";
import { useColorScheme } from "@/components/useColorScheme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemePreferenceProvider>
        <RootLayoutNav />
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-song" options={{ title: "Add Song" }} />
        <Stack.Screen name="edit-song/[id]" options={{ title: "Edit Song" }} />
        <Stack.Screen name="create-setlist" options={{ title: "Create Setlist" }} />
<Stack.Screen name="setlist/[id]" options={{ headerShown: false }} />        <Stack.Screen name="setlist/[id]/add-songs" options={{ title: "Add Songs" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Settings" }} />
      </Stack>
    </ThemeProvider>
  );
}