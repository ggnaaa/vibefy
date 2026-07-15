import { useState } from 'react';
import { Plus, Trash2, Music, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';

export default function Library() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showSaved = params.get('tab') === 'saved';
  const { playlists, createPlaylist, deletePlaylist, likedSongs, savedSongs, creations } = useMusicStore();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  if (showSaved) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => navigate('/library')} className="rounded-full p-2 hover:bg-white/10">
            <ArrowLeft size={22} />
          </button>
          <h1 className="brand text-2xl">Saved</h1>
        </div>
        {savedSongs.length === 0 ? (
          <p className="text-[var(--color-mute)]">Save tracks from the ⋮ menu for quick access.</p>
        ) : (
          savedSongs.map((song, i) => (
            <SongRow key={song.id} song={song} queue={savedSongs} showIndex index={i} />
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="brand text-3xl">Library</h1>
        <button
          className="rounded-full bg-[var(--color-accent)] p-2 text-black"
          onClick={() => setModal(true)}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/liked')}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-4 text-left"
        >
          <span className="text-2xl">♥</span>
          <div>
            <p className="font-bold">Liked</p>
            <p className="text-xs text-white/80">{likedSongs.length} songs</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/library?tab=saved')}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-left"
        >
          <span className="text-2xl">↓</span>
          <div>
            <p className="font-bold">Saved</p>
            <p className="text-xs text-white/80">{savedSongs.length} songs</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/create')}
          className="col-span-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#ff5a36] to-[#3dff9a] p-4 text-left text-black"
        >
          <span className="text-2xl">✦</span>
          <div>
            <p className="font-bold">AI creations</p>
            <p className="text-xs text-black/70">{creations.length} tracks · open Create</p>
          </div>
        </button>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">Playlists</h2>
      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
          <p className="mb-2 font-bold">No playlists yet</p>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black" onClick={() => setModal(true)}>
            Create one
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-[var(--color-elevated)]"
              onClick={() => navigate(`/playlist/${pl.id}`)}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ background: `linear-gradient(135deg, ${pl.color}, ${pl.color}88)` }}
              >
                {pl.songs[0] ? (
                  <img src={pl.songs[0].cover} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <Music size={20} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pl.name}</p>
                <p className="text-xs text-[var(--color-mute)]">{pl.songs.length} songs</p>
              </div>
              <button
                className="p-2 text-[var(--color-mute)]"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(pl.id);
                  toast('Playlist deleted');
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={() => setModal(false)}>
          <div
            className="w-full max-w-md rounded-3xl bg-[var(--color-panel)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">New playlist</h3>
            <input
              className="mb-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5 outline-none"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <input
              className="mb-4 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5 outline-none"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl border border-[var(--color-line)] py-2.5" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 font-bold text-black disabled:opacity-40"
                disabled={!name.trim()}
                onClick={() => {
                  createPlaylist(name.trim(), desc.trim());
                  setName('');
                  setDesc('');
                  setModal(false);
                  toast('Playlist created');
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
