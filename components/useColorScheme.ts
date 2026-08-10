import { useThemePreference } from "./theme-preference";

export const useColorScheme = () => {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme;
};