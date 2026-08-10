import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { deleteSong, getSongs, Song } from "@/store/song-store";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function TabOneScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const isDark = theme === "dark";

const [songs, setSongs] = useState<Song[]>([]);
const [searchQuery, setSearchQuery] = useState("");
  const rowBorderColor = isDark ? "#3A3A3A" : "#D9D9D9";
  const rowBackgroundA = isDark ? "#1E1E1E" : "#FFFFFF";
  const rowBackgroundB = isDark ? "#242424" : "#F3F3F3";
  const subtleText = isDark ? "#B3B3B3" : "#6B7280";
  const metaText = isDark ? "#A3A3A3" : "#666666";
  const actionSurface = isDark ? "#101319" : "#FFFFFF";

  const loadSongs = useCallback(async () => {
    const loadedSongs = await getSongs();
    setSongs(loadedSongs.slice().reverse());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSongs();
    }, [loadSongs])
  );
    const filteredSongs = songs.filter((song) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  });

  const confirmDelete = (id: string, title: string) => {
    Alert.alert("Delete song?", `Delete "${title}" from your Library?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSong(id);
          loadSongs();
        },
      },
    ]);
  };

 return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.text }]}>Library</Text>
      <Text style={[styles.subtitle, { color: subtleText }]}>
        Build your song library here, then add songs into setlists.
      </Text>

           <Pressable
        style={[
          styles.primaryButton,
          {
            borderColor: rowBorderColor,
            backgroundColor: actionSurface,
          },
        ]}
        onPress={() => router.push("/create-song")}
      >
        <Text style={[styles.primaryButtonText, { color: palette.text }]}>
          + Add Song
        </Text>
      </Pressable>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search songs or artists"
        placeholderTextColor={subtleText}
        style={[
          styles.searchInput,
          {
            color: palette.text,
            borderColor: rowBorderColor,
            backgroundColor: actionSurface,
          },
        ]}
      />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSongs.length === 0 ? (
                    <Text style={[styles.emptyText, { color: subtleText }]}>
            No songs yet. Tap “+ Add Song” to create your first one.
          </Text>
        ) : (
          filteredSongs.map((song, index) => {
                        const rowBackground = index % 2 === 0 ? rowBackgroundA : rowBackgroundB;

            return (
              <View
                key={song.id}
                style={[
                  styles.songRow,
                  {
                    backgroundColor: rowBackground,
                    borderColor: rowBorderColor,
                  },
                ]}
              >
                <Pressable
                  style={styles.songInfo}
                  onPress={() => router.push(`/edit-song/${song.id}`)}
                >
                  <Text
                    style={[styles.songTitle, { color: palette.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {song.title}
                  </Text>

                  <Text
                    style={[styles.songArtist, { color: subtleText }]}
                    numberOfLines={1}
                  >
                    {song.artist}
                  </Text>

                  <Text
                    style={[styles.songMeta, { color: metaText }]}
                    numberOfLines={1}
                  >
                    {song.key ? `Key ${song.key}` : "No Key"}
                    {song.capo ? ` • Capo ${song.capo}` : " • No Capo"}
                  </Text>
                </Pressable>

                <View style={styles.actionsColumn}>
                  <Pressable
                    style={[
                      styles.rowActionButton,
                      {
                        borderColor: rowBorderColor,
                        backgroundColor: actionSurface,
                      },
                    ]}
                    onPress={() => router.push(`/edit-song/${song.id}`)}
                  >
                    <Text
                      style={[styles.rowActionText, { color: palette.text }]}
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.rowActionButton,
                      {
                        borderColor: rowBorderColor,
                        backgroundColor: actionSurface,
                      },
                    ]}
                    onPress={() => confirmDelete(song.id, song.title)}
                  >
                    <Text
                      style={[styles.rowActionText, { color: palette.danger }]}
                    >
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 12,
    lineHeight: 20,
  },

  primaryButton: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
    searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 18,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 40,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },

  songRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  songInfo: {
    flex: 1,
    paddingRight: 12,
  },

  songTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },

  songArtist: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 16,
  },

  songMeta: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 15,
  },

  actionsColumn: {
    width: 78,
    alignItems: "stretch",
    gap: 8,
  },

  rowActionButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  rowActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
});