import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RepeatMode, Track, UserPlaylist, UserProfile } from '@/types/music';

interface MusicState {
  currentSong: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  consecutiveFails: number;

  likedSongs: Track[];
  savedSongs: Track[];
  creations: Track[];
  playlists: UserPlaylist[];
  recentlyPlayed: Track[];
  user: UserProfile;

  showLyrics: boolean;
  currentLyrics: { lyrics: string; source: string } | null;
  lyricsLoading: boolean;

  setIsPlaying: (v: boolean) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLyrics: () => void;
  setCurrentLyrics: (l: { lyrics: string; source: string } | null) => void;
  setLyricsLoading: (v: boolean) => void;
  resetFailCount: () => void;
  bumpFailCount: () => number;

  playSong: (song: Track, queueList?: Track[]) => void;
  playNext: () => boolean;
  playPrev: () => void;
  togglePlayPause: () => void;

  toggleLike: (song: Track) => void;
  isLiked: (id: string) => boolean;
  toggleSaved: (song: Track) => void;
  isSaved: (id: string) => boolean;
  addToRecentlyPlayed: (song: Track) => void;
  addCreation: (song: Track) => void;
  removeCreation: (id: string) => void;

  createPlaylist: (name: string, description?: string) => UserPlaylist;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Track) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const COLORS = ['#ff5a36', '#3dff9a', '#5b8cff', '#ffb020', '#e85dff'];

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      queue: [],
      queueIndex: 0,
      volume: 0.85,
      shuffle: false,
      repeat: 'none',
      consecutiveFails: 0,

      likedSongs: [],
      savedSongs: [],
      creations: [],
      playlists: [],
      recentlyPlayed: [],
      user: {
        name: 'Listener',
        avatar: null,
        bio: 'Finding the next vibe',
        joinDate: new Date().toISOString(),
      },

      showLyrics: false,
      currentLyrics: null,
      lyricsLoading: false,

      setIsPlaying: (v) => set({ isPlaying: v }),
      setVolume: (v) => set({ volume: v }),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      toggleRepeat: () =>
        set((s) => ({
          repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
        })),
      toggleLyrics: () => set((s) => ({ showLyrics: !s.showLyrics })),
      setCurrentLyrics: (l) => set({ currentLyrics: l }),
      setLyricsLoading: (v) => set({ lyricsLoading: v }),
      resetFailCount: () => set({ consecutiveFails: 0 }),
      bumpFailCount: () => {
        const n = get().consecutiveFails + 1;
        set({ consecutiveFails: n });
        return n;
      },

      playSong: (song, queueList = []) => {
        const queue = queueList.length ? queueList : [song];
        const idx = Math.max(0, queue.findIndex((s) => s.id === song.id));
        set({
          currentSong: song,
          isPlaying: true,
          queue,
          queueIndex: idx,
          currentLyrics: null,
          consecutiveFails: 0,
        });
        get().addToRecentlyPlayed(song);
      },

      playNext: () => {
        const { queue, queueIndex, shuffle, repeat } = get();
        if (!queue.length) return false;

        if (shuffle) {
          const nextIdx = Math.floor(Math.random() * queue.length);
          const next = queue[nextIdx];
          set({ currentSong: next, queueIndex: nextIdx, isPlaying: true, currentLyrics: null });
          get().addToRecentlyPlayed(next);
          return true;
        }

        if (repeat === 'one') {
          set({ isPlaying: true, currentLyrics: null });
          return true;
        }

        const nextIdx = queueIndex + 1;
        if (nextIdx >= queue.length) {
          if (repeat === 'all') {
            const next = queue[0];
            set({ currentSong: next, queueIndex: 0, isPlaying: true, currentLyrics: null });
            get().addToRecentlyPlayed(next);
            return true;
          }
          set({ isPlaying: false });
          return false;
        }

        const next = queue[nextIdx];
        set({ currentSong: next, queueIndex: nextIdx, isPlaying: true, currentLyrics: null });
        get().addToRecentlyPlayed(next);
        return true;
      },

      playPrev: () => {
        const { queue, queueIndex } = get();
        if (!queue.length) return;
        const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
        const prev = queue[prevIdx];
        set({ currentSong: prev, queueIndex: prevIdx, isPlaying: true, currentLyrics: null });
      },

      togglePlayPause: () => {
        const { currentSong, isPlaying } = get();
        if (!currentSong) return;
        set({ isPlaying: !isPlaying });
      },

      toggleLike: (song) => {
        const { likedSongs } = get();
        const exists = likedSongs.some((s) => s.id === song.id);
        set({
          likedSongs: exists
            ? likedSongs.filter((s) => s.id !== song.id)
            : [song, ...likedSongs],
        });
      },
      isLiked: (id) => get().likedSongs.some((s) => s.id === id),

      toggleSaved: (song) => {
        const { savedSongs } = get();
        const exists = savedSongs.some((s) => s.id === song.id);
        set({
          savedSongs: exists
            ? savedSongs.filter((s) => s.id !== song.id)
            : [song, ...savedSongs],
        });
      },
      isSaved: (id) => get().savedSongs.some((s) => s.id === id),

      addToRecentlyPlayed: (song) => {
        const filtered = get().recentlyPlayed.filter((s) => s.id !== song.id);
        set({ recentlyPlayed: [song, ...filtered].slice(0, 40) });
      },

      addCreation: (song) => {
        set((s) => ({ creations: [song, ...s.creations].slice(0, 8) }));
      },

      removeCreation: (id) => {
        set((s) => ({ creations: s.creations.filter((c) => c.id !== id) }));
      },

      createPlaylist: (name, description = '') => {
        const pl: UserPlaylist = {
          id: Date.now().toString(),
          name,
          description,
          songs: [],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ playlists: [...s.playlists, pl] }));
        return pl;
      },

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addSongToPlaylist: (playlistId, song) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.songs.some((x) => x.id === song.id)
              ? { ...p, songs: [...p.songs, song] }
              : p
          ),
        }));
      },

      removeSongFromPlaylist: (playlistId, songId) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((x) => x.id !== songId) }
              : p
          ),
        }));
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    {
      name: 'vibefy-v2',
      partialize: (s) => ({
        likedSongs: s.likedSongs,
        savedSongs: s.savedSongs,
        creations: s.creations,
        playlists: s.playlists,
        recentlyPlayed: s.recentlyPlayed,
        user: s.user,
        volume: s.volume,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    }
  )
);
