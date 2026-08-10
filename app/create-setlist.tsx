import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { addSetlist } from "@/store/setlist-store";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

export default function CreateSetlistScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const isDark = theme === "dark";

  const [name, setName] = useState("");

 const rowBorderColor = isDark ? "#3A3A3A" : "#D9D9D9";
const actionSurface = isDark ? "#101319" : "#FFFFFF";
const inputBackground = isDark ? "#14171D" : "#FFFFFF";
const subtleText = isDark ? "#B3B3B3" : "#6B7280";

  const handleCreateSetlist = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

await addSetlist({
  id: Date.now().toString(),
  name: trimmed,
  songs: [],
}); 
router.back();
  };

return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <>
      <Stack.Screen
        options={{
          title: "Create Setlist",
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.background,
          },
        ]}
      >
        <View
          style={[
            styles.formShell,
            {
              backgroundColor: actionSurface,
              borderColor: rowBorderColor,
            },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: palette.text }]}>
            Setlist Name
          </Text>

          <TextInput
            placeholder="Enter setlist name"
            placeholderTextColor={subtleText}
            style={[
              styles.input,
              {
                color: palette.text,
                borderColor: rowBorderColor,
                backgroundColor: inputBackground,
              },
            ]}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleCreateSetlist}
          />
        </View>

        <Pressable
          style={[
            styles.button,
            {
              borderColor: rowBorderColor,
              backgroundColor: actionSurface,
            },
          ]}
          onPress={handleCreateSetlist}
        >
          <Text style={[styles.buttonText, { color: palette.text }]}>
            Save Setlist
          </Text>
        </Pressable>
      </View>
    </>
  </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },

  formShell: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  button: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});