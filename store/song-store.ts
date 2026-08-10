import AsyncStorage from "@react-native-async-storage/async-storage";

export type Song = {
  id: string;
  title: string;
  artist: string;
  key?: string;
  capo?: string;
  lyrics?: string;
  tabUrl?: string;
};

const SONGS_STORAGE_KEY = "setlist-organizer-songs";
const SETLISTS_STORAGE_KEY = "setlist-organizer-setlists";

export async function getSongs(): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(SONGS_STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as Song[];
  } catch {
    return [];
  }
}

export async function getSongById(id: string): Promise<Song | null> {
  const songs = await getSongs();
  return songs.find((song) => song.id === id) ?? null;
}

export async function addSong(song: Song): Promise<void> {
  const songs = await getSongs();
  const updatedSongs = [...songs, song];
  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(updatedSongs));
}

export async function updateSong(updatedSong: Song): Promise<void> {
  const songs = await getSongs();

  const updatedSongs = songs.map((song) =>
    song.id === updatedSong.id ? updatedSong : song
  );

  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(updatedSongs));
}

export async function deleteSong(id: string): Promise<void> {
  const songs = await getSongs();
  const updatedSongs = songs.filter((song) => song.id !== id);
  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(updatedSongs));

  const rawSetlists = await AsyncStorage.getItem(SETLISTS_STORAGE_KEY);

  if (!rawSetlists) return;

  try {
    const setlists = JSON.parse(rawSetlists) as Array<{
      id: string;
      name: string;
      songs?: Array<{ songId: string; played: boolean }>;
      songIds?: string[];
    }>;

    const cleanedSetlists = setlists.map((setlist) => {
      const normalizedSongs = Array.isArray(setlist.songs)
        ? setlist.songs
        : Array.isArray(setlist.songIds)
        ? setlist.songIds.map((songId) => ({ songId, played: false }))
        : [];

      return {
        id: setlist.id,
        name: setlist.name,
        songs: normalizedSongs.filter((entry) => entry.songId !== id),
      };
    });

    await AsyncStorage.setItem(
      SETLISTS_STORAGE_KEY,
      JSON.stringify(cleanedSetlists)
    );
  } catch {
    // do nothing
  }
}