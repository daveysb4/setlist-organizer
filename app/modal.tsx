import { Text, View } from "@/components/Themed";
import { useThemePreference } from "@/components/theme-preference";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Switch } from "react-native";

export default function ModalScreen() {
  const router = useRouter();
  const { preference, setPreference, resolvedScheme } = useThemePreference();

  const usePhoneSetting = preference === "system";
  const isDarkMode = resolvedScheme === "dark";

  const handleDarkModeToggle = async (value: boolean) => {
    await setPreference(value ? "dark" : "light");
  };

  const handlePhoneSettingToggle = async (value: boolean) => {
    if (value) {
      await setPreference("system");
      return;
    }

    await setPreference(isDarkMode ? "dark" : "light");
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Appearance</Text>
      <Text style={styles.subtitle}>
        Current theme: {resolvedScheme === "dark" ? "Dark Mode" : "Light Mode"}
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSubtitle}>
              Switch between light and dark mode
            </Text>
          </View>

          <Switch
            value={usePhoneSetting ? resolvedScheme === "dark" : preference === "dark"}
            onValueChange={handleDarkModeToggle}
            disabled={usePhoneSetting}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Use Phone Setting</Text>
            <Text style={styles.rowSubtitle}>
              Match your device appearance and override the toggle above
            </Text>
          </View>

          <Switch
            value={usePhoneSetting}
            onValueChange={handlePhoneSettingToggle}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  topBar: {
    marginBottom: 8,
    alignItems: "flex-start",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.9,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  rowSubtitle: {
    marginTop: 5,
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 20,
  },
});
