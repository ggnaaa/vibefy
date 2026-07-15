import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Download, Play, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Track } from '@/types/music';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';

const PRESETS = [
  'warm lo-fi beat with soft vinyl crackle',
  'uplifting indie pop guitar and light drums',
  'dark ambient pads with slow pulse',
  'funky bass groove electronic dance',
  'peaceful piano melody with rain ambience',
];

function coverFor(prompt: string) {
  const seed = encodeURIComponent(prompt.slice(0, 24) || 'vibefy');
  return `https://picsum.photos/seed/${seed}/400/400`;
}

export default function Create() {
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { creations, addCreation, removeCreation, playSong, user } = useMusicStore();

  const bars = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setProgress(8);
    const tick = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 6));
    }, 800);

    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const mime = data.mime || 'audio/wav';
      const streamUrl = `data:${mime};base64,${data.audioBase64}`;
      const track: Track = {
        id: `ai_${Date.now()}`,
        title: title.trim() || prompt.trim().slice(0, 42),
        artist: user.name || 'You',
        cover: coverFor(prompt),
        duration: 12,
        streamUrl,
        source: 'ai',
        genre: 'AI',
        prompt: prompt.trim(),
        createdAt: new Date().toISOString(),
      };

      addCreation(track);
      setProgress(100);
      toast.success('Track created — play it now');
      playSong(track, [track, ...creations]);
      setTitle('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate');
    } finally {
      window.clearInterval(tick);
      setGenerating(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const download = (track: Track) => {
    if (!track.streamUrl) return;
    const a = document.createElement('a');
    a.href = track.streamUrl;
    a.download = `${track.title.replace(/\s+/g, '-')}.wav`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-sm text-[var(--color-accent-2)]">Create · Listen · Enjoy</p>
        <h1 className="brand mt-1 text-3xl">Make a track</h1>
        <p className="mt-2 text-sm text-[var(--color-mute)]">
          Free AI music with MusicGen (Hugging Face). Short instrumental clips — ad-free in Vibefy.
        </p>
      </motion.header>

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[var(--color-accent-2)]/15 blur-3xl" />

        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mb-3 w-full resize-none rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          placeholder="Describe the vibe…"
        />

        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                prompt === p
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-elevated)] text-[var(--color-soft)]'
              }`}
            >
              {p.split(' ').slice(0, 3).join(' ')}…
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="mb-4 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5 text-sm outline-none"
        />

        <AnimatePresence>
          {generating && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-2 flex h-12 items-end justify-center gap-1">
                {bars.map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-[var(--color-accent)] to-[var(--color-accent-2)]"
                    animate={{ height: [8, 28 + (i % 5) * 6, 10] }}
                    transition={{ repeat: Infinity, duration: 0.7 + (i % 4) * 0.1, ease: 'easeInOut' }}
                  />
                ))}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-[var(--color-mute)]">
                Composing… first run can take 30–60s while the model wakes up
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={generate}
          disabled={generating || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#ff8a5c] py-3.5 text-sm font-extrabold text-black shadow-[0_0_40px_var(--color-glow)] disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="spin" /> Generating
            </>
          ) : (
            <>
              <Wand2 size={18} /> Create with AI
            </>
          )}
        </button>
      </motion.div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
          <Sparkles size={14} /> My creations
        </h2>
        {creations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-mute)]">
            Your AI tracks land here — play, like, or download.
          </p>
        ) : (
          <div className="space-y-1">
            {creations.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative"
              >
                <SongRow song={song} queue={creations} showIndex index={i} />
                <div className="absolute right-14 top-1/2 flex -translate-y-1/2 gap-1">
                  <button
                    className="rounded-full p-2 text-[var(--color-mute)] hover:text-white"
                    onClick={() => playSong(song, creations)}
                    title="Play"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    className="rounded-full p-2 text-[var(--color-mute)] hover:text-white"
                    onClick={() => download(song)}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className="rounded-full p-2 text-[var(--color-mute)] hover:text-rose-400"
                    onClick={() => {
                      removeCreation(song.id);
                      toast('Removed');
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
