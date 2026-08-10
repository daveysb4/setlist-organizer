import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getSetlists, saveSetlists, Setlist } from "@/store/setlist-store";
import { getSongById, updateSong } from "@/store/song-store";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function EditSongScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const songId = Array.isArray(params.id) ? params.id[0] : params.id;

  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const isDark = theme === "dark";

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("");
  const [capo, setCapo] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [tabUrl, setTabUrl] = useState("");
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlistIds, setSelectedSetlistIds] = useState<string[]>([]);
  const [showSetlistPicker, setShowSetlistPicker] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const rowBorderColor = isDark ? "#3A3A3A" : "#D9D9D9";
  const surfaceA = isDark ? "#1E1E1E" : "#FFFFFF";
  const surfaceB = isDark ? "#242424" : "#F3F3F3";
  const actionSurface = isDark ? "#101319" : "#FFFFFF";
  const subtleText = isDark ? "#B3B3B3" : "#6B7280";
  const metaText = isDark ? "#A3A3A3" : "#666666";
  const inputBackground = isDark ? "#14171D" : "#FFFFFF";

  const loadData = useCallback(async () => {
    if (!songId) return;

    const song = await getSongById(songId);
    const allSetlists = await getSetlists();

    if (!song) return;

    setTitle(song.title ?? "");
    setArtist(song.artist ?? "");
    setKey(song.key ?? "");
    setCapo(song.capo ?? "");
    setLyrics(song.lyrics ?? "");
    setTabUrl(song.tabUrl ?? "");
    setSetlists(allSetlists);

    const preselectedSetlistIds = allSetlists
      .filter((setlist) =>
        setlist.songs.some((entry) => entry.songId === songId)
      )
      .map((setlist) => setlist.id);

    setSelectedSetlistIds(preselectedSetlistIds);
    setIsLoaded(true);
  }, [songId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleSetlistSelection = (setlistId: string) => {
    setSelectedSetlistIds((current) =>
      current.includes(setlistId)
        ? current.filter((id) => id !== setlistId)
        : [...current, setlistId]
    );
  };

  const selectedCountLabel = useMemo(() => {
    if (selectedSetlistIds.length === 0) return "None selected";
    if (selectedSetlistIds.length === 1) return "1 setlist selected";
    return `${selectedSetlistIds.length} setlists selected`;
  }, [selectedSetlistIds]);

  const handleSaveSong = async () => {
    if (!songId || !title.trim() || !artist.trim()) return;

    await updateSong({
      id: songId,
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim(),
      capo: capo.trim(),
      lyrics,
      tabUrl: tabUrl.trim(),
    });

    const updatedSetlists = setlists.map((setlist) => {
      const shouldContainSong = selectedSetlistIds.includes(setlist.id);
      const existingEntry = setlist.songs.find((entry) => entry.songId === songId);

      if (shouldContainSong && existingEntry) {
        return setlist;
      }

      if (shouldContainSong && !existingEntry) {
        return {
          ...setlist,
          songs: [
            ...setlist.songs,
            {
              songId,
              played: false,
            },
          ],
        };
      }

      if (!shouldContainSong && existingEntry) {
        return {
          ...setlist,
          songs: setlist.songs.filter((entry) => entry.songId !== songId),
        };
      }

      return setlist;
    });

    await saveSetlists(updatedSetlists);
    router.back();
  };

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: palette.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: subtleText }]}>
          Loading song...
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <>
       <Stack.Screen
  options={{
    title: "Edit Song",
    headerBackButtonDisplayMode: "minimal",
    headerRight: () => (
      <Pressable onPress={handleSaveSong} style={{ paddingHorizontal: 8 }}>
        <Text style={{ color: palette.text, fontWeight: "700", fontSize: 16 }}>
          Save
        </Text>
      </Pressable>
    ),
  }}
/>

        <KeyboardAvoidingView
          style={[
            styles.flex,
            {
              backgroundColor: palette.background,
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            showsVerticalScrollIndicator={false}
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
                Song Title
              </Text>
              <TextInput
                placeholder="Enter song title"
                placeholderTextColor={subtleText}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: rowBorderColor,
                    backgroundColor: inputBackground,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />

              <Text style={[styles.fieldLabel, { color: palette.text }]}>
                Artist
              </Text>
              <TextInput
                placeholder="Enter artist name"
                placeholderTextColor={subtleText}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: rowBorderColor,
                    backgroundColor: inputBackground,
                  },
                ]}
                value={artist}
                onChangeText={setArtist}
                returnKeyType="next"
              />

              <View style={styles.twoColRow}>
                <View style={styles.twoColField}>
                  <Text style={[styles.fieldLabel, { color: palette.text }]}>
                    Key
                  </Text>
                  <TextInput
                    placeholder="Key"
                    placeholderTextColor={subtleText}
                    style={[
                      styles.input,
                      {
                        color: palette.text,
                        borderColor: rowBorderColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    value={key}
                    onChangeText={setKey}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.twoColField}>
                  <Text style={[styles.fieldLabel, { color: palette.text }]}>
                    Capo
                  </Text>
                  <TextInput
                    placeholder="Capo"
                    placeholderTextColor={subtleText}
                    style={[
                      styles.input,
                      {
                        color: palette.text,
                        borderColor: rowBorderColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    value={capo}
                    onChangeText={setCapo}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: palette.text }]}>
                Tabs Link
              </Text>
              <TextInput
                placeholder="Ultimate Guitar / tabs link"
                placeholderTextColor={subtleText}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: rowBorderColor,
                    backgroundColor: inputBackground,
                  },
                ]}
                value={tabUrl}
                onChangeText={setTabUrl}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="next"
              />

              <Text style={[styles.fieldLabel, { color: palette.text }]}>
                Lyrics
              </Text>
              <TextInput
                placeholder="Paste lyrics here"
                placeholderTextColor={subtleText}
                style={[
                  styles.input,
                  styles.lyricsInput,
                  {
                    color: palette.text,
                    borderColor: rowBorderColor,
                    backgroundColor: inputBackground,
                  },
                ]}
                value={lyrics}
                onChangeText={setLyrics}
                multiline
                textAlignVertical="top"
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                scrollEnabled={false}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Setlists
              </Text>

              <Pressable
                style={[
                  styles.dropdownButton,
                  {
                    borderColor: rowBorderColor,
                    backgroundColor: actionSurface,
                  },
                ]}
                onPress={() => setShowSetlistPicker((current) => !current)}
              >
                <View style={styles.dropdownButtonTextWrap}>
                  <Text
                    style={[styles.dropdownButtonTitle, { color: palette.text }]}
                  >
                    Manage Setlists
                  </Text>
                  <Text
                    style={[styles.dropdownButtonSubtitle, { color: subtleText }]}
                  >
                    {selectedCountLabel}
                  </Text>
                </View>
                <Text style={[styles.dropdownChevron, { color: palette.text }]}>
                  {showSetlistPicker ? "▲" : "▼"}
                </Text>
              </Pressable>

              {showSetlistPicker ? (
                <View style={styles.dropdownPanel}>
                  {setlists.length === 0 ? (
                    <Text style={[styles.emptyText, { color: subtleText }]}>
                      No setlists yet. Create a setlist first to use this feature.
                    </Text>
                  ) : (
                    setlists.map((setlist, index) => {
                      const isSelected = selectedSetlistIds.includes(setlist.id);
                      const rowBackground = index % 2 === 0 ? surfaceA : surfaceB;

                      return (
                        <Pressable
                          key={setlist.id}
                          style={[
                            styles.setlistRow,
                            {
                              borderColor: rowBorderColor,
                              backgroundColor: rowBackground,
                            },
                          ]}
                          onPress={() => toggleSetlistSelection(setlist.id)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderColor: isSelected
                                  ? palette.accent
                                  : rowBorderColor,
                                backgroundColor: isSelected
                                  ? palette.accent
                                  : rowBackground,
                              },
                            ]}
                          >
                            <Text style={styles.checkboxText}>
                              {isSelected ? "✓" : ""}
                            </Text>
                          </View>

                          <View style={styles.setlistTextWrap}>
                            <Text
                              style={[styles.setlistName, { color: palette.text }]}
                              numberOfLines={1}
                            >
                              {setlist.name}
                            </Text>
                            <Text style={[styles.setlistMeta, { color: metaText }]}>
                              {setlist.songs.length} song
                              {setlist.songs.length === 1 ? "" : "s"}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 16,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 140,
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
    marginBottom: 14,
  },

  lyricsInput: {
    minHeight: 220,
    paddingTop: 12,
    paddingBottom: 12,
  },

  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },

  twoColField: {
    flex: 1,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownButtonTextWrap: {
    flex: 1,
  },

  dropdownButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  dropdownButtonSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  dropdownChevron: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },

  dropdownPanel: {
    marginTop: 10,
    gap: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },

  setlistRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.4,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  checkboxText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  setlistTextWrap: {
    flex: 1,
  },

  setlistName: {
    fontSize: 14,
    fontWeight: "700",
  },

  setlistMeta: {
    marginTop: 2,
    fontSize: 12,
  },

  button: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});