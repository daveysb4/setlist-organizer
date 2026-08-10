import AsyncStorage from "@react-native-async-storage/async-storage";

export type SetlistSongEntry = {
  songId: string;
  played: boolean;
};

export type Setlist = {
  id: string;
  name: string;
  songs: SetlistSongEntry[];
};

const SETLISTS_STORAGE_KEY = "setlist-organizer-setlists";

type OldSetlist = {
  id: string;
  name: string;
  songIds?: string[];
};

function normalizeSetlist(raw: any): Setlist {
  if (Array.isArray(raw?.songs)) {
    return {
      id: raw.id,
      name: raw.name,
      songs: raw.songs.map((item: any) => ({
        songId: item.songId,
        played: !!item.played,
      })),
    };
  }

  const oldSongIds = Array.isArray(raw?.songIds) ? raw.songIds : [];

  return {
    id: raw.id,
    name: raw.name,
    songs: oldSongIds.map((songId: string) => ({
      songId,
      played: false,
    })),
  };
}

export async function getSetlists(): Promise<Setlist[]> {
  const raw = await AsyncStorage.getItem(SETLISTS_STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Setlist | OldSetlist>;
    return parsed.map(normalizeSetlist);
  } catch {
    return [];
  }
}

export async function getSetlistById(id: string): Promise<Setlist | null> {
  const setlists = await getSetlists();
  return setlists.find((setlist) => setlist.id === id) ?? null;
}

export async function saveSetlists(setlists: Setlist[]): Promise<void> {
  await AsyncStorage.setItem(SETLISTS_STORAGE_KEY, JSON.stringify(setlists));
}

export async function addSetlist(setlist: Setlist): Promise<void> {
  const setlists = await getSetlists();
  const updatedSetlists = [...setlists, setlist];
  await saveSetlists(updatedSetlists);
}

export async function updateSetlist(updatedSetlist: Setlist): Promise<void> {
  const setlists = await getSetlists();

  const updatedSetlists = setlists.map((setlist) =>
    setlist.id === updatedSetlist.id ? updatedSetlist : setlist
  );

  await saveSetlists(updatedSetlists);
}

export async function deleteSetlist(id: string): Promise<void> {
  const setlists = await getSetlists();
  const updatedSetlists = setlists.filter((setlist) => setlist.id !== id);
  await saveSetlists(updatedSetlists);
}