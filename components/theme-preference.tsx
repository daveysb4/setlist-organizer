import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ThemePreference = "light" | "dark" | "system";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: "light" | "dark";
  setPreference: (value: ThemePreference) => Promise<void>;
  isLoaded: boolean;
};

const STORAGE_KEY = "setlist-organizer-theme-preference";

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(
  undefined
);

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadPreference();
  }, []);

  const setPreference = async (value: ThemePreference) => {
    setPreferenceState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const resolvedScheme: "light" | "dark" =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      isLoaded,
    }),
    [preference, resolvedScheme, isLoaded]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error("useThemePreference must be used inside ThemePreferenceProvider");
  }

  return context;
}