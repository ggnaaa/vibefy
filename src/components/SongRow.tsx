import { useState } from 'react';
import { Heart, MoreVertical, Plus, Bookmark, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Track } from '@/types/music';
import { useMusicStore } from '@/store/musicStore';

function formatTime(sec: number) {
  if (!sec || !Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SongRow({
  song,
  queue = [],
  index,
  showIndex,
}: {
  song: Track;
  queue?: Track[];
  index?: number;
  showIndex?: boolean;
}) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    toggleLike,
    isLiked,
    toggleSaved,
    isSaved,
    playlists,
    addSongToPlaylist,
  } = useMusicStore();
  const [menu, setMenu] = useState(false);

  const active = currentSong?.id === song.id;
  const liked = isLiked(song.id);
  const saved = isSaved(song.id);

  const onRow = () => {
    if (active) togglePlayPause();
    else playSong(song, queue.length ? queue : [song]);
  };

  return (
    <div
      onClick={onRow}
      className={`group relative flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--color-elevated)] ${
        active ? 'bg-[var(--color-elevated)]' : ''
      }`}
    >
      <div className="w-6 shrink-0 text-center text-xs font-bold text-[var(--color-mute)]">
        {active && isPlaying ? (
          <span className="inline-flex gap-0.5">
            <i className="h-3 w-0.5 animate-pulse bg-[var(--color-accent)]" />
            <i className="h-3 w-0.5 animate-pulse bg-[var(--color-accent)] [animation-delay:120ms]" />
            <i className="h-3 w-0.5 animate-pulse bg-[var(--color-accent)] [animation-delay:240ms]" />
          </span>
        ) : showIndex ? (
          (index ?? 0) + 1
        ) : null}
      </div>

      <img
        src={song.cover}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${song.id}/96/96`;
        }}
      />

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${active ? 'text-[var(--color-accent)]' : ''}`}>
          {song.title}
        </p>
        <p className="truncate text-xs text-[var(--color-mute)]">
          {song.artist}
          <span className="ml-1.5 rounded bg-[var(--color-panel)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {song.source}
          </span>
        </p>
      </div>

      <span className="hidden text-xs text-[var(--color-mute)] sm:block">
        {formatTime(song.duration)}
      </span>

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          className={`rounded-full p-2 ${liked ? 'text-rose-400' : 'text-[var(--color-mute)]'}`}
          onClick={() => {
            toggleLike(song);
            toast(liked ? 'Removed from liked' : 'Liked');
          }}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          className="rounded-full p-2 text-[var(--color-mute)]"
          onClick={() => setMenu((m) => !m)}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {menu && (
        <div
          className="absolute right-2 top-14 z-20 min-w-[180px] rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-1 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-elevated)]"
            onClick={() => {
              toggleSaved(song);
              toast(saved ? 'Removed from saved' : 'Saved');
              setMenu(false);
            }}
          >
            {saved ? <Check size={14} /> : <Bookmark size={14} />}
            {saved ? 'Unsave' : 'Save'}
          </button>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-elevated)]"
              onClick={() => {
                addSongToPlaylist(pl.id, song);
                toast(`Added to ${pl.name}`);
                setMenu(false);
              }}
            >
              <Plus size={14} />
              {pl.name}
            </button>
          ))}
          {!playlists.length && (
            <p className="px-3 py-2 text-xs text-[var(--color-mute)]">Create a playlist in Library</p>
          )}
        </div>
      )}
    </div>
  );
}
