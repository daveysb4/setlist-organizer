import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getSetlistById, Setlist, updateSetlist } from "@/store/setlist-store";
import { getSongs, Song } from "@/store/song-store";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AddSongsToSetlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setlistId = Array.isArray(params.id) ? params.id[0] : params.id;

  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const isDark = theme === "dark";

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const rowBorderColor = isDark ? "#3A3A3A" : "#D9D9D9";
  const rowBackgroundA = isDark ? "#1E1E1E" : "#FFFFFF";
  const rowBackgroundB = isDark ? "#242424" : "#F3F3F3";
  const subtleText = isDark ? "#B3B3B3" : "#6B7280";
  const metaText = isDark ? "#A3A3A3" : "#666666";
  const actionSurface = isDark ? "#101319" : "#FFFFFF";

  const loadData = useCallback(async () => {
    if (!setlistId) return;

    const songs = await getSongs();
    const existingSetlist = await getSetlistById(setlistId);

    if (!existingSetlist) return;

    setAllSongs(songs.slice().reverse());
    setSetlist(existingSetlist);
    setSelectedSongIds(existingSetlist.songs.map((entry) => entry.songId));
  }, [setlistId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allSongs;

    return allSongs.filter((song) => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    });
  }, [allSongs, searchQuery]);

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((current) =>
      current.includes(songId)
        ? current.filter((id) => id !== songId)
        : [...current, songId]
    );
  };

  const handleSave = async () => {
    if (!setlist) return;

    const existingPlayedMap = new Map(
      setlist.songs.map((entry) => [entry.songId, entry.played])
    );

    const dedupedSelectedSongIds = Array.from(new Set(selectedSongIds));

    const updatedSetlist: Setlist = {
      ...setlist,
      songs: dedupedSelectedSongIds.map((songId) => ({
        songId,
        played: existingPlayedMap.get(songId) ?? false,
      })),
    };

    await updateSetlist(updatedSetlist);
    setSetlist(updatedSetlist);
    router.back();
  };

  const selectedCountLabel =
    selectedSongIds.length === 1
      ? "1 song selected"
      : `${selectedSongIds.length} songs selected`;

return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
  <>
      <Stack.Screen
        options={{
          title: "Add Songs",
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
        <Text style={[styles.subtitle, { color: subtleText }]}>
          Search your library and select songs to add to this setlist.
        </Text>

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

        <Text style={[styles.selectionCount, { color: metaText }]}>
          {selectedCountLabel}
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredSongs.length === 0 ? (
            <Text style={[styles.emptyText, { color: subtleText }]}>
              {allSongs.length === 0
                ? "No songs in your library yet."
                : "No matching songs found."}
            </Text>
          ) : (
            filteredSongs.map((song, index) => {
              const isSelected = selectedSongIds.includes(song.id);
              const rowBackground =
                index % 2 === 0 ? rowBackgroundA : rowBackgroundB;

              return (
                <Pressable
                  key={song.id}
                  style={[
                    styles.songRow,
                    {
                      backgroundColor: rowBackground,
                      borderColor: rowBorderColor,
                    },
                  ]}
                  onPress={() => toggleSongSelection(song.id)}
                >
                  <View style={styles.songInfo}>
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
                  </View>

                  <View style={styles.actionsColumn}>
                    {isSelected ? (
                      <Text style={[styles.checkmark, { color: palette.text }]}>
                        ✓
                      </Text>
                    ) : (
                      <View
                        style={[
                          styles.rowActionButton,
                          {
                            borderColor: rowBorderColor,
                            backgroundColor: actionSurface,
                          },
                        ]}
                      >
                        <Text style={[styles.rowActionText, { color: palette.text }]}>
                          Add
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <Pressable
          style={[
            styles.saveButton,
            {
              borderColor: rowBorderColor,
              backgroundColor: actionSurface,
            },
          ]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: palette.text }]}>
            Save Changes
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

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
    paddingHorizontal: 12,
    lineHeight: 20,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },

  selectionCount: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 24,
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
    width: 82,
    alignItems: "stretch",
    justifyContent: "center",
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

  checkmark: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  saveButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 14,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});