import { Text, } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  getSetlistById,
  Setlist,
  SetlistSongEntry,
  updateSetlist,
} from "@/store/setlist-store";
import { getSongs, Song } from "@/store/song-store";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SwipeableAny = Swipeable as any;
type DisplaySongRow = {
  entry: SetlistSongEntry;
  song: Song;
};

export default function SetlistDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
    const theme = useColorScheme() ?? "light";
  const isDark = theme === "dark";
    const borderColor = isDark ? "#3A3A3A" : "#D9D9D9";
  const headerBackground = isDark ? "#101319" : "#FFFFFF";
  const lyricsBackground = isDark ? "#14171D" : "#FFFFFF";
  const lyricsTextColor = isDark ? "#F2F3F5" : "#222222";
  const checkboxBorderColor = isDark ? "#8A8A8A" : "#777777";
  const dragBarColor = isDark ? "#A3A3A3" : "#777777";
  const titleColor = isDark ? "#FFFFFF" : "#111111";
  const artistColor = isDark ? "#B3B3B3" : "#9A9A9A";
  const metaColor = isDark ? "#A3A3A3" : "#444444";
  const headerSubtleColor = isDark ? "#A3A3A3" : "#666666";
  const palette = Colors[theme];
  const params = useLocalSearchParams();
  const setlistId = Array.isArray(params.id) ? params.id[0] : params.id;

   const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [showSearch, setShowSearch] = useState(false);
const [pendingPlayedMap, setPendingPlayedMap] = useState<Record<string, boolean>>(
  {}
);
const searchInputRef = useRef<TextInput>(null);

const lyricsExpandAnim = useRef(new Animated.Value(0)).current;
const [visibleLyricsSongId, setVisibleLyricsSongId] = useState<string | null>(null);

const searchExpandAnim = useRef(new Animated.Value(0)).current;
const [renderSearch, setRenderSearch] = useState(false);  
useEffect(() => {
  if (showSearch) {
    setRenderSearch(true);
    searchExpandAnim.setValue(0);

    Animated.timing(searchExpandAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
    });
  } else if (renderSearch) {
    Animated.timing(searchExpandAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      setRenderSearch(false);
    });
  }
}, [showSearch]);
  const swipeableRefs = useRef<Record<string, any>>({});

  const loadData = useCallback(async () => {
    if (!setlistId) return;

    const foundSetlist = await getSetlistById(setlistId);
    const songsFromLibrary = await getSongs();

    setSetlist(foundSetlist);
    setAllSongs(songsFromLibrary);
  }, [setlistId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const displaySongs = useMemo<DisplaySongRow[]>(() => {
  if (!setlist) return [];

  const rows = setlist.songs
    .map((entry) => {
      const song = allSongs.find((item) => item.id === entry.songId);
      if (!song) return null;
      return { entry, song };
    })
    .filter(Boolean) as DisplaySongRow[];

  const unplayed = rows.filter((row) => !row.entry.played);
  const played = rows.filter((row) => row.entry.played);

  return [...unplayed, ...played];
}, [setlist, allSongs]);

  const hasPlayedSongs = useMemo(() => {
    if (!setlist) return false;
    return setlist.songs.some((entry) => entry.played);
  }, [setlist]);
    const filteredDisplaySongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displaySongs;

    return displaySongs.filter(({ song }) => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    });
  }, [displaySongs, searchQuery]);

  const saveUpdatedEntries = async (updatedEntries: SetlistSongEntry[]) => {
    if (!setlist) return;

    const updatedSetlist: Setlist = {
      ...setlist,
      songs: updatedEntries,
    };

    await updateSetlist(updatedSetlist);
    setSetlist(updatedSetlist);
  };

  const closeSwipeable = (songId: string) => {
    swipeableRefs.current[songId]?.close();
  };

  const closeAllSwipeables = () => {
    Object.values(swipeableRefs.current).forEach((ref) => ref?.close());
  };

  const removeSong = async (songId: string) => {
    if (!setlist) return;

    const updatedEntries = setlist.songs.filter(
      (entry) => entry.songId !== songId
    );

    await saveUpdatedEntries(updatedEntries);

    if (expandedSongId === songId) {
      setExpandedSongId(null);
    }
  };

  const confirmRemoveSong = (songId: string, title: string) => {
    Alert.alert(
      "Remove Song",
      `Remove "${title}" from this setlist?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => closeSwipeable(songId),
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeSong(songId);
          },
        },
      ]
    );
  };

const togglePlayed = async (songId: string) => {
  if (!setlist) return;

  const targetEntry = setlist.songs.find((entry) => entry.songId === songId);
  if (!targetEntry) return;

  if (songId in pendingPlayedMap) return;

  const nextPlayed = !targetEntry.played;

  setPendingPlayedMap((current) => ({
    ...current,
    [songId]: nextPlayed,
  }));

  setTimeout(async () => {
    const latestSetlist = await getSetlistById(setlistId);
    if (!latestSetlist) {
      setPendingPlayedMap((current) => {
        const updated = { ...current };
        delete updated[songId];
        return updated;
      });
      return;
    }

    const updatedEntries = latestSetlist.songs.map((entry) =>
      entry.songId === songId
        ? { ...entry, played: nextPlayed }
        : entry
    );

    await saveUpdatedEntries(updatedEntries);

    setPendingPlayedMap((current) => {
      const updated = { ...current };
      delete updated[songId];
      return updated;
    });
  }, 220);
};

  const resetPlayedSongs = () => {
    if (!setlist || !hasPlayedSongs) return;

    Alert.alert(
      "Reset Setlist",
      "Mark all songs as unplayed for a new gig?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const updatedEntries = setlist.songs.map((entry) => ({
              ...entry,
              played: false,
            }));

            await saveUpdatedEntries(updatedEntries);
          },
        },
      ]
    );
  };

const toggleLyrics = (songId: string) => {
  closeAllSwipeables();

  if (expandedSongId === songId) {
    Animated.timing(lyricsExpandAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: false,
    }).start(() => {
      setExpandedSongId(null);
      setVisibleLyricsSongId(null);
    });

    return;
  }

  if (expandedSongId && expandedSongId !== songId) {
    Animated.timing(lyricsExpandAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      setExpandedSongId(songId);
      setVisibleLyricsSongId(songId);
      lyricsExpandAnim.setValue(0);

      Animated.timing(lyricsExpandAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: false,
      }).start();
    });

    return;
  }

  setExpandedSongId(songId);
  setVisibleLyricsSongId(songId);
  lyricsExpandAnim.setValue(0);

  Animated.timing(lyricsExpandAnim, {
    toValue: 1,
    duration: 260,
    useNativeDriver: false,
  }).start();
};

  const openTabs = async (tabUrl?: string) => {
    if (!tabUrl?.trim()) return;

    const url = tabUrl.trim();
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleDragEnd = async ({
    data,
    from,
    to,
  }: {
    data: DisplaySongRow[];
    from: number;
    to: number;
  }) => {
    if (!setlist || from === to) return;

    const fromRow = displaySongs[from];
    const toRow = displaySongs[to];

    if (!fromRow || !toRow) return;

    if (fromRow.entry.played !== toRow.entry.played) {
      return;
    }

    const updatedEntries = data.map((row) => row.entry);
    await saveUpdatedEntries(updatedEntries);
  };

 const renderLeftActions = (song: Song) => {
  return (
    <Pressable
      style={[styles.swipeActionSquare, { backgroundColor: palette.accent }]}
      onPress={() => {
        closeSwipeable(song.id);
        router.push(`/edit-song/${song.id}`);
      }}
    >
      <Text style={styles.swipeIconText}>✎</Text>
    </Pressable>
  );
};

const renderRightActions = (song: Song) => {
  return (
    <Pressable
      style={[styles.swipeActionSquare, { backgroundColor: palette.danger }]}
      onPress={() => confirmRemoveSong(song.id, song.title)}
    >
      <Text style={styles.swipeIconText}>🗑</Text>
    </Pressable>
  );
};

   const renderSongItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<DisplaySongRow>) => {
    const { song, entry } = item;
   const isPlayed =
  pendingPlayedMap[song.id] !== undefined
    ? pendingPlayedMap[song.id]
    : entry.played;
    const index = getIndex() ?? 0;

    const rowBackground =
      index % 2 === 0
        ? isDark
          ? "#1E1E1E"
          : "#FFFFFF"
        : isDark
        ? "#242424"
        : "#F3F3F3";

    return (
      <View style={[styles.songBlock, isPlayed && styles.songBlockPlayed]}>
        <SwipeableAny
          ref={(ref: any) => {
            swipeableRefs.current[song.id] = ref;
          }}
          renderLeftActions={() => renderLeftActions(song)}
          renderRightActions={() => renderRightActions(song)}
          overshootLeft={false}
          overshootRight={false}
          leftThreshold={48}
          rightThreshold={48}
          friction={2}
        >
          <View
            style={[
              styles.songCard,
              isActive && styles.songCardActive,
              {
                borderColor,
                backgroundColor: rowBackground,
              },
            ]}
          >
            <View
              style={[
                styles.songTopRow,
                {
                  backgroundColor: rowBackground,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.songTitleCell,
                  {
                    backgroundColor: rowBackground,
                  },
                ]}
                onPress={() => toggleLyrics(song.id)}
              >
               <Text
  style={[styles.songTitle, { color: titleColor }]}
  numberOfLines={2}
  ellipsizeMode="tail"
>
  {song.title}
</Text>
                <Text
                  style={[styles.songArtist, { color: artistColor }]}
                  numberOfLines={1}
                >
                  {song.artist}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.songCheckCell,
                  {
                    backgroundColor: rowBackground,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.checkbox,
                    {
                      borderColor: checkboxBorderColor,
                      backgroundColor: rowBackground,
                    },
                  ]}
                  onPress={() => togglePlayed(song.id)}
                  hitSlop={10}
                >
                  <Text style={[styles.checkboxText, { color: titleColor }]}>
                    {isPlayed ? "✓" : ""}
                  </Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.songCapoCell,
                  {
                    backgroundColor: rowBackground,
                  },
                ]}
              >
                <Text
                  style={[styles.songMeta, { color: metaColor }]}
                  numberOfLines={1}
                >
                  {song.capo ? `Capo ${song.capo}` : "No Capo"}
                </Text>
              </View>

              <View
                style={[
                  styles.songLinkCell,
                  {
                    backgroundColor: rowBackground,
                  },
                ]}
              >
                {song.tabUrl?.trim() ? (
                  <Pressable
                    onPress={() => openTabs(song.tabUrl)}
                    style={[
                      styles.linkButton,
                      {
                        backgroundColor: rowBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.tabLinkIcon, { color: palette.text }]}>↗</Text>
                  </Pressable>
                ) : null}
              </View>

              <View
                style={[
                  styles.songDragCell,
                  {
                    backgroundColor: rowBackground,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.dragHandle,
                    {
                      backgroundColor: rowBackground,
                    },
                  ]}
                  onLongPress={() => {
                    closeAllSwipeables();
                    drag();
                  }}
                  delayLongPress={220}
                  hitSlop={10}
                >
                  <View
                    style={[
                      styles.dragBars,
                      {
                        backgroundColor: rowBackground,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dragBar,
                        { backgroundColor: dragBarColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.dragBar,
                        { backgroundColor: dragBarColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.dragBar,
                        { backgroundColor: dragBarColor },
                      ]}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </SwipeableAny>

       {visibleLyricsSongId === song.id ? (
  <Animated.View
    style={[
      styles.lyricsBox,
      {
        borderColor,
        backgroundColor: lyricsBackground,
        opacity: lyricsExpandAnim,
        maxHeight: lyricsExpandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenHeight * 0.65],
        }),
      },
    ]}
  >
    <ScrollView>
      <Text style={[styles.lyricsText, { color: lyricsTextColor }]}>
        {song.lyrics?.trim()
          ? song.lyrics
          : "No lyrics saved for this song yet."}
      </Text>
    </ScrollView>
  </Animated.View>
) : null}
      </View>
    );
  };

    if (!setlist) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>
          Setlist not found
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: palette.background,
        },
      ]}
    >
           <View
        style={[
          styles.headerShell,
          {
            backgroundColor: headerBackground,
            borderColor,
          },
        ]}
      >
        <View style={styles.topNavRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: palette.text }]}>
              {"‹"}
            </Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>{setlist.name}</Text>
            <Text style={[styles.songCount, { color: headerSubtleColor }]}>
              {displaySongs.length} song{displaySongs.length === 1 ? "" : "s"}
            </Text>

            <Pressable
              onPress={resetPlayedSongs}
              disabled={!hasPlayedSongs}
              style={styles.centerResetWrap}
            >
              <Text
                style={[
                  styles.resetText,
                  { color: headerSubtleColor },
                  !hasPlayedSongs && styles.disabledResetText,
                ]}
              >
                Reset
              </Text>
            </Pressable>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.addIconButton}
              onPress={() => router.push(`/setlist/${setlist.id}/add-songs`)}
            >
              <Text style={[styles.addIconText, { color: palette.text }]}>
                +
              </Text>
            </Pressable>

<Pressable
  style={styles.searchIconButton}
  onPress={() => {
    if (showSearch) {
      setSearchQuery("");
      searchInputRef.current?.blur();
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  }}
>
  <Text style={[styles.searchIconText, { color: palette.text }]}>
    {showSearch ? "×" : "⌕"}
  </Text>
</Pressable>
          </View>
        </View>

{renderSearch ? (
  <Animated.View
    style={{
      opacity: searchExpandAnim,
      maxHeight: searchExpandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 60],
      }),
      overflow: "hidden",
    }}
  >
    <TextInput
      ref={searchInputRef}
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search songs or artists"
      placeholderTextColor={headerSubtleColor}
      returnKeyType="done"
      onSubmitEditing={() => {
        setShowSearch(false);
      }}
      onBlur={() => {
        if (!searchQuery) {
          setShowSearch(false);
        }
      }}
      style={[
        styles.searchInput,
        {
          color: palette.text,
          borderColor,
          backgroundColor: headerBackground,
        },
      ]}
    />
  </Animated.View>
) : null}
      </View>

      {filteredDisplaySongs.length === 0 ? (
         <Text style={[styles.emptyText, { color: palette.mutedText }]}>
          {displaySongs.length === 0
            ? "No songs in this setlist yet."
            : "No matching songs found."}
        </Text>
      ) : (
                <DraggableFlatList
          data={filteredDisplaySongs}
          keyExtractor={(item) => item.song.id}
          renderItem={renderSongItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 88 },
          ]}
          showsVerticalScrollIndicator={false}
          activationDistance={12}
        />
      )}
    </View>
  );
}
const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  headerShell: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    marginBottom: 14,
  },

   topNavRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 72,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 38,
    lineHeight: 38,
    color: "#111111",
    fontWeight: "400",
  },

   headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },

 headerRight: {
  width: 52,
  alignItems: "center",
  justifyContent: "flex-start",
  paddingTop: 2,
},

 addIconButton: {
  width: 44,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 2,
},

 searchIconButton: {
  width: 44,
  height: 32,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 0,
},

  addIconText: {
    fontSize: 34,
    fontWeight: "400",
    lineHeight: 34,
    color: "#111111",
  },

 searchIconText: {
  fontSize: 36,
  lineHeight: 34,
  fontWeight: "400",
},

   resetTextWrap: {
    marginTop: 2,
    minHeight: 20,
  },

    centerResetWrap: {
    marginTop: 4,
    minHeight: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  resetText: {
    fontSize: 14,
    textDecorationLine: "underline",
    color: "#777777",
  },

  disabledResetText: {
    opacity: 0.35,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
    textAlign: "center",
  },

  songCount: {
    fontSize: 14,
    marginBottom: 0,
    textAlign: "center",
    color: "#666666",
  },

  listContent: {
    paddingBottom: 0,
  },

     searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 12,
  },

  emptyText: {
    marginTop: 12,
  },

  songBlock: {
    marginBottom: 1,
  },

  songBlockPlayed: {
    opacity: 0.5,
  },

    songCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },

  songCardPlayed: {},

    songCardActive: {
    opacity: 0.96,
    transform: [{ scale: 1.01 }],
  },

     songTopRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },

   songTitleCell: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 2,
    paddingVertical: 2,
  },

 songCheckCell: {
  width: 34,
  alignItems: "flex-end",
  justifyContent: "center",
},

 songCapoCell: {
  width: 72,
  alignItems: "flex-end",
  justifyContent: "center",
},

  songTabCell: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  songLinkCell: {
  width: 30,
  alignItems: "flex-end",
  justifyContent: "center",
},

 songDragCell: {
  width: 24,
  alignItems: "flex-end",
  justifyContent: "center",
},

 linkButton: {
  width: 22,
  height: 22,
  alignItems: "center",
  justifyContent: "center",
},

     songTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 18,
  },

    songArtist: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9a9a9a",
    marginTop: 2,
    lineHeight: 14,
  },

songMeta: {
  fontSize: 12,
  color: "#444444",
  textAlign: "right",
},

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.2,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  checkboxText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },

tabLinkIcon: {
  fontSize: 24,
  lineHeight: 24,
  fontWeight: "500",
  textAlign: "center",
},

  dragHandle: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  dragBars: {
    width: 16,
    gap: 2.5,
  },

  dragBar: {
    height: 1.8,
    borderRadius: 999,
    backgroundColor: "#777777",
  },

  swipeActionSquare: {
    width: 44,
    height: 44,
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

  lyricsBox: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    maxHeight: screenHeight * 0.65,
  },

    lyricsText: {
    fontSize: 15,
    lineHeight: 24,
  },
});