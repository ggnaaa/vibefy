import { useState } from 'react';
import { ArrowLeft, Play, Search, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMusicStore } from '@/store/musicStore';
import { searchCatalog } from '@/services/musicService';
import type { Track } from '@/types/music';
import SongRow from '@/components/SongRow';

export default function PlaylistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, playSong, removeSongFromPlaylist, addSongToPlaylist } = useMusicStore();
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <div className="text-center">
        <p className="mb-3">Playlist not found</p>
        <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black" onClick={() => navigate('/library')}>
          Back
        </button>
      </div>
    );
  }

  const onSearch = async (val: string) => {
    setQ(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await searchCatalog(val, 15);
    setResults(res.tracks);
    setSearching(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft size={22} />
        </button>
        <h1 className="truncate text-xl font-bold">{playlist.name}</h1>
      </div>

      <div
        className="mb-4 flex aspect-[16/7] items-center justify-center rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${playlist.color}, ${playlist.color}55)` }}
      >
        <div className="text-center">
          <p className="text-xl font-extrabold">{playlist.name}</p>
          <p className="text-sm text-white/80">{playlist.songs.length} songs</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] py-2.5 font-bold text-black disabled:opacity-40"
          disabled={!playlist.songs.length}
          onClick={() => playSong(playlist.songs[0], playlist.songs)}
        >
          <Play size={16} fill="currentColor" /> Play all
        </button>
        <button className="rounded-full border border-[var(--color-line)] px-4 font-semibold" onClick={() => setShowAdd((s) => !s)}>
          + Add
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mute)]" />
            <input
              className="w-full rounded-xl bg-[var(--color-ink)] py-2 pl-9 pr-3 text-sm outline-none"
              placeholder="Search to add…"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          {searching && <p className="text-xs text-[var(--color-mute)]">Searching…</p>}
          <div className="max-h-48 overflow-y-auto">
            {results.map((song) => {
              const inPl = playlist.songs.some((s) => s.id === song.id);
              return (
                <button
                  key={song.id}
                  disabled={inPl}
                  className="flex w-full items-center gap-2 py-2 text-left disabled:opacity-40"
                  onClick={() => {
                    addSongToPlaylist(playlist.id, song);
                    toast(`Added ${song.title}`);
                  }}
                >
                  <img src={song.cover} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{song.title}</p>
                    <p className="truncate text-xs text-[var(--color-mute)]">{song.artist}</p>
                  </div>
                  <span className="text-[var(--color-accent)]">{inPl ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {playlist.songs.length === 0 ? (
        <p className="text-center text-[var(--color-mute)]">Empty playlist — add songs above.</p>
      ) : (
        playlist.songs.map((song, i) => (
          <div key={song.id} className="relative">
            <SongRow song={song} queue={playlist.songs} showIndex index={i} />
            <button
              className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-[var(--color-mute)]"
              onClick={() => {
                removeSongFromPlaylist(playlist.id, song.id);
                toast('Removed');
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
