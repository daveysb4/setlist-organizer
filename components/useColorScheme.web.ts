import { useThemePreference } from "./theme-preference";

export function useColorScheme() {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme;
}