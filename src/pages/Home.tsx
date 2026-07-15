import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Clock, TrendingUp, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchTrending, fetchUnderground, fetchCcPicks, fetchByMood, MOODS } from '@/services/musicService';
import type { Track } from '@/types/music';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Track[]>([]);
  const [underground, setUnderground] = useState<Track[]>([]);
  const [cc, setCc] = useState<Track[]>([]);
  const [moodTracks, setMoodTracks] = useState<Track[]>([]);
  const [mood, setMood] = useState<(typeof MOODS)[number]>(MOODS[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { recentlyPlayed, playSong, creations } = useMusicStore();

  const load = useCallback(async () => {
    setLoading(true);
    const [t, u, c] = await Promise.all([
      fetchTrending(12),
      fetchUnderground(10),
      fetchCcPicks(10),
    ]);
    setTrending(t);
    setUnderground(u);
    setCc(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    fetchByMood(mood.query, 10).then(setMoodTracks);
  }, [mood]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      <motion.header
        className="flex items-start justify-between gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <p className="text-sm text-[var(--color-mute)]">{greeting()}</p>
          <h1 className="brand mt-1 text-4xl leading-none text-white">Vibefy</h1>
          <p className="mt-2 max-w-[18rem] text-sm text-[var(--color-soft)]">
            Create, listen & enjoy — ad-free Audius vibes plus your own AI tracks.
          </p>
        </div>
        <button
          className={`rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] p-2.5 ${refreshing ? 'spin' : ''}`}
          onClick={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        >
          <RefreshCw size={18} />
        </button>
      </motion.header>

      <motion.button
        onClick={() => navigate('/create')}
        className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-gradient-to-r from-[#2a1210] to-[#102218] p-4 text-left"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-black">
          <Wand2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Open Beat Studio</p>
          <p className="text-xs text-[var(--color-mute)]">Drums · piano · guitar · vocals</p>
        </div>
        <Sparkles className="text-[var(--color-accent-2)]" size={18} />
      </motion.button>

      {creations.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
            <Sparkles size={14} /> Your AI tracks
          </h2>
          <div className="h-scroll">
            {creations.slice(0, 8).map((song, i) => (
              <motion.button
                key={song.id}
                className="w-[120px] shrink-0 text-left"
                onClick={() => playSong(song, creations)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <img src={song.cover} alt="" className="mb-2 aspect-square w-full rounded-xl object-cover ring-1 ring-[var(--color-accent)]/40" />
                <p className="truncate text-xs font-semibold">{song.title}</p>
                <p className="truncate text-[11px] text-[var(--color-mute)]">AI · {song.artist}</p>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {recentlyPlayed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
            <Clock size={14} /> Recently played
          </h2>
          <div className="h-scroll">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <button
                key={song.id}
                className="w-[120px] shrink-0 text-left"
                onClick={() => playSong(song, recentlyPlayed)}
              >
                <img src={song.cover} alt="" className="mb-2 aspect-square w-full rounded-xl object-cover" />
                <p className="truncate text-xs font-semibold">{song.title}</p>
                <p className="truncate text-[11px] text-[var(--color-mute)]">{song.artist}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
          <TrendingUp size={14} /> Trending on Audius
        </h2>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
        ) : trending.length ? (
          trending.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <SongRow song={song} queue={trending} showIndex index={i} />
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-[var(--color-mute)]">No trending tracks right now. Try Search or Create.</p>
        )}
      </section>

      {underground.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
            <Sparkles size={14} /> Underground
          </h2>
          <div className="h-scroll">
            {underground.map((song) => (
              <button
                key={song.id}
                className="w-[140px] shrink-0 text-left"
                onClick={() => playSong(song, underground)}
              >
                <img src={song.cover} alt="" className="mb-2 aspect-square w-full rounded-2xl object-cover" />
                <p className="truncate text-sm font-semibold">{song.title}</p>
                <p className="truncate text-xs text-[var(--color-mute)]">{song.artist}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">Moods</h2>
        <div className="h-scroll mb-3">
          {MOODS.map((m) => (
            <button
              key={m.query}
              onClick={() => setMood(m)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mood.query === m.query
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-elevated)] text-[var(--color-soft)]'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
        {moodTracks.map((song, i) => (
          <SongRow key={song.id} song={song} queue={moodTracks} showIndex index={i} />
        ))}
      </section>

      {cc.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
            Jamendo CC picks
          </h2>
          {cc.map((song, i) => (
            <SongRow key={song.id} song={song} queue={cc} showIndex index={i} />
          ))}
        </section>
      )}
    </div>
  );
}
