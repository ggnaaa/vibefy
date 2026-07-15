import { useEffect, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Heart, ChevronDown,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Mic2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAudioEngine } from '@/lib/audioEngine';
import { fetchLyrics, generateAILyrics } from '@/services/musicService';
import { useMusicStore } from '@/store/musicStore';

function fmt(sec: number) {
  if (!sec || !Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Player() {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    currentSong, isPlaying, setIsPlaying,
    volume, setVolume, playNext, playPrev,
    toggleLike, isLiked, shuffle, toggleShuffle,
    repeat, toggleRepeat, toggleLyrics, showLyrics,
    setCurrentLyrics, setLyricsLoading, currentLyrics,
    resetFailCount, bumpFailCount,
  } = useMusicStore();

  useEffect(() => {
    const engine = getAudioEngine();
    engine.setHandlers({
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onEnded: () => {
        playNext();
      },
      onTime: (c, d) => {
        setProgress(c);
        if (d) setDuration(d);
      },
      onLoading: setLoading,
      onError: () => {
        const fails = bumpFailCount();
        if (fails >= 3) {
          toast.error('Playback issues — paused. Try another track.');
          setIsPlaying(false);
          resetFailCount();
          return;
        }
        toast.error('Could not load track — trying next');
        setTimeout(() => playNext(), 600);
      },
    });
  }, [setIsPlaying, playNext, bumpFailCount, resetFailCount]);

  useEffect(() => {
    if (!currentSong) return;
    const engine = getAudioEngine();
    engine.setVolume(muted ? 0 : volume);
    engine.load(currentSong, isPlaying).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload on track id
  }, [currentSong?.id]);

  useEffect(() => {
    const engine = getAudioEngine();
    if (!currentSong) return;
    if (isPlaying) engine.play().catch(() => setIsPlaying(false));
    else engine.pause();
  }, [isPlaying, currentSong, setIsPlaying]);

  useEffect(() => {
    getAudioEngine().setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  if (!currentSong) return null;

  const liked = isLiked(currentSong.id);
  const pct = duration ? (progress / duration) * 100 : 0;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    getAudioEngine().seek(ratio * duration);
    setProgress(ratio * duration);
  };

  const openLyrics = async () => {
    toggleLyrics();
    if (currentLyrics || !currentSong) return;
    setLyricsLoading(true);
    const real = await fetchLyrics(currentSong.artist, currentSong.title);
    if (real) {
      setCurrentLyrics(real);
      setLyricsLoading(false);
      return;
    }
    toast('Generating lyrics…');
    const ai = await generateAILyrics(currentSong);
    setCurrentLyrics(ai || { lyrics: 'No lyrics available.', source: 'none' });
    setLyricsLoading(false);
  };

  return (
    <>
      {!expanded && (
        <div
          className="fixed bottom-[68px] left-1/2 z-50 w-[calc(100%-24px)] max-w-[480px] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-panel)_95%,transparent)] shadow-2xl backdrop-blur-xl"
          onClick={() => setExpanded(true)}
        >
          <div className="h-0.5 bg-[var(--color-line)]">
            <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <img src={currentSong.cover} alt="" className="h-11 w-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{currentSong.title}</p>
              <p className="truncate text-xs text-[var(--color-mute)]">{currentSong.artist}</p>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {loading ? (
                <div className="spin h-5 w-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
              ) : (
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
              )}
              <button className="p-2 text-[var(--color-soft)]" onClick={() => playNext()}>
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-[60] mx-auto flex max-w-lg flex-col bg-[var(--color-ink)]">
          <div
            className="absolute inset-0 opacity-30 blur-2xl"
            style={{ backgroundImage: `url(${currentSong.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[var(--color-ink)]/90 to-[var(--color-ink)]" />

          <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-4">
            <div className="mb-6 flex items-center justify-between">
              <button className="rounded-full p-2 hover:bg-white/10" onClick={() => setExpanded(false)}>
                <ChevronDown size={24} />
              </button>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-mute)]">Now playing</span>
              <button
                className={`rounded-full p-2 ${showLyrics ? 'text-[var(--color-accent)]' : ''}`}
                onClick={openLyrics}
              >
                <Mic2 size={20} />
              </button>
            </div>

            <div className="mx-auto mb-8 w-full max-w-sm">
              <img
                src={currentSong.cover}
                alt=""
                className={`aspect-square w-full rounded-3xl object-cover shadow-2xl transition ${isPlaying ? 'scale-[1.01]' : 'scale-100'}`}
              />
            </div>

            <div className="mb-6 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
                  {currentSong.title}
                </h2>
                <p className="truncate text-[var(--color-mute)]">{currentSong.artist}</p>
              </div>
              <button
                className={`shrink-0 rounded-full p-2 ${liked ? 'text-rose-400' : 'text-[var(--color-mute)]'}`}
                onClick={() => {
                  toggleLike(currentSong);
                  toast(liked ? 'Removed' : 'Liked');
                }}
              >
                <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="mb-6">
              <div className="h-1.5 cursor-pointer rounded-full bg-white/15" onClick={seek}>
                <div className="relative h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }}>
                  <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow" />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-[var(--color-mute)]">
                <span>{fmt(progress)}</span>
                <span>{loading ? '…' : fmt(duration)}</span>
              </div>
            </div>

            <div className="mb-8 flex items-center justify-between px-2">
              <button className={`p-2 ${shuffle ? 'text-[var(--color-accent-2)]' : 'text-[var(--color-mute)]'}`} onClick={toggleShuffle}>
                <Shuffle size={18} />
              </button>
              <button className="p-2" onClick={playPrev}><SkipBack size={28} fill="white" /></button>
              <button
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-[0_0_40px_var(--color-glow)]"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {loading ? (
                  <div className="spin h-6 w-6 rounded-full border-2 border-black border-t-transparent" />
                ) : isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button className="p-2" onClick={() => playNext()}><SkipForward size={28} fill="white" /></button>
              <button className={`p-2 ${repeat !== 'none' ? 'text-[var(--color-accent-2)]' : 'text-[var(--color-mute)]'}`} onClick={toggleRepeat}>
                {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            <div className="mt-auto flex items-center gap-3">
              <button onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setMuted(false);
                }}
                className="flex-1 accent-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
