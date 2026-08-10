import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  addSetlist,
  deleteSetlist,
  getSetlists,
  Setlist,
  updateSetlist,
} from "@/store/setlist-store";
import { getSongs } from "@/store/song-store";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

const SwipeableAny = Swipeable as any;

export default function SetlistsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const isDark = theme === "dark";

  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const swipeableRefs = useRef<Record<string, any>>({});

  const rowBorderColor = isDark ? "#3A3A3A" : "#D9D9D9";
  const rowBackgroundA = isDark ? "#1E1E1E" : "#FFFFFF";
  const rowBackgroundB = isDark ? "#242424" : "#F3F3F3";
  const subtleText = isDark ? "#B3B3B3" : "#6B7280";
  const metaText = isDark ? "#A3A3A3" : "#666666";
  const actionSurface = isDark ? "#101319" : "#FFFFFF";

  const loadSetlists = useCallback(async () => {
    const loadedSetlists = await getSetlists();
    const librarySongs = await getSongs();

    const validSongIds = new Set(librarySongs.map((song) => song.id));

    const cleanedSetlists = await Promise.all(
      loadedSetlists.map(async (setlist) => {
        const filteredSongs = setlist.songs.filter((entry) =>
          validSongIds.has(entry.songId)
        );

        if (filteredSongs.length !== setlist.songs.length) {
          const cleaned = { ...setlist, songs: filteredSongs };
          await updateSetlist(cleaned);
          return cleaned;
        }

        return setlist;
      })
    );

    setSetlists(cleanedSetlists.slice().reverse());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSetlists();
    }, [loadSetlists])
  );

  const closeSwipeable = (setlistId: string) => {
    swipeableRefs.current[setlistId]?.close();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete setlist?", `Delete "${name}"?`, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => closeSwipeable(id),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSetlist(id);
          loadSetlists();
        },
      },
    ]);
  };

  const handleRename = (setlist: Setlist) => {
    Alert.prompt(
      "Rename Setlist",
      "Enter a new name:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (value?: string) => {
            const trimmed = value?.trim();
            if (!trimmed) return;

            await updateSetlist({
              ...setlist,
              name: trimmed,
            });

            loadSetlists();
          },
        },
      ],
      "plain-text",
      setlist.name
    );
  };

  const handleDuplicate = async (setlist: Setlist) => {
    const duplicatedSetlist: Setlist = {
      id: Date.now().toString(),
      name: `${setlist.name} (Copy)`,
      songs: setlist.songs.map((entry) => ({
        songId: entry.songId,
        played: false,
      })),
    };

    await addSetlist(duplicatedSetlist);
    loadSetlists();
  };

  const renderRightActions = (setlist: Setlist) => {
    return (
      <Pressable
        style={[styles.swipeActionSquare, { backgroundColor: palette.danger }]}
        onPress={() => handleDelete(setlist.id, setlist.name)}
      >
        <Text style={styles.swipeIconText}>🗑</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.text }]}>Setlists</Text>
      <Text style={[styles.subtitle, { color: subtleText }]}>
        Create a setlist, then add songs from your library into it. Swipe left to delete a setlist.
      </Text>

      <Pressable
        style={[
          styles.primaryButton,
          {
            borderColor: rowBorderColor,
            backgroundColor: actionSurface,
          },
        ]}
        onPress={() => router.push("/create-setlist")}
      >
        <Text style={[styles.primaryButtonText, { color: palette.text }]}>
          + New Setlist
        </Text>
      </Pressable>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {setlists.length === 0 ? (
          <Text style={[styles.emptyText, { color: subtleText }]}>
            No setlists yet. Tap “+ New Setlist” to create your first one.
          </Text>
        ) : (
          setlists.map((setlist, index) => {
            const rowBackground = index % 2 === 0 ? rowBackgroundA : rowBackgroundB;
            const songCount = setlist.songs.length;

            return (
              <View key={setlist.id} style={styles.rowWrap}>
                <SwipeableAny
                  ref={(ref: any) => {
                    swipeableRefs.current[setlist.id] = ref;
                  }}
                  renderRightActions={() => renderRightActions(setlist)}
                  overshootRight={false}
                  rightThreshold={48}
                  friction={2}
                >
                  <View
                    style={[
                      styles.setlistRow,
                      {
                        backgroundColor: rowBackground,
                        borderColor: rowBorderColor,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.setlistInfo}
                      onPress={() => router.push(`/setlist/${setlist.id}`)}
                    >
                      <Text
                        style={[styles.setlistName, { color: palette.text }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {setlist.name}
                      </Text>

                      <Text style={[styles.setlistMeta, { color: metaText }]}>
                        {songCount} song{songCount === 1 ? "" : "s"}
                      </Text>
                    </Pressable>

                    <View style={styles.actionsInline}>
                      <Pressable
                        style={[
                          styles.renameButton,
                          {
                            borderColor: rowBorderColor,
                            backgroundColor: actionSurface,
                          },
                        ]}
                        onPress={() => handleRename(setlist)}
                      >
                        <Text style={[styles.renameText, { color: palette.text }]}>
                          Rename
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.duplicateIconButton}
                        onPress={() => handleDuplicate(setlist)}
                      >
                        <Text
                          style={[styles.duplicateIconText, { color: palette.text }]}
                        >
                          ⧉
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </SwipeableAny>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
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

  rowWrap: {
    marginBottom: 10,
  },

  setlistRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  setlistInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "center",
  },

  setlistName: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },

  setlistMeta: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 16,
  },

  actionsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },

  renameButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 34,
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  renameText: {
    fontSize: 12,
    fontWeight: "700",
  },

  duplicateIconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  duplicateIconText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "500",
  },

  swipeActionSquare: {
    width: 54,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },

  swipeIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});