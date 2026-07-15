import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Square, Mic, MicOff, Download, Trash2, Sparkles,
  Wand2, Loader2, Music2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Track } from '@/types/music';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';
import {
  BEAT_PRESETS,
  CHORDS,
  DEFAULT_INSTRUMENTS,
  DRUMS,
  STEPS,
  blobToDataUrl,
  getBeatStudio,
  type ChordId,
  type DrumId,
  type InstrumentToggles,
  type Pattern,
} from '@/lib/beatStudio';

function coverFor(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed.slice(0, 28) || 'studio')}/400/400`;
}

function clonePattern(p: Pattern): Pattern {
  return {
    kick: [...p.kick],
    snare: [...p.snare],
    hat: [...p.hat],
    clap: [...p.clap],
  };
}

export default function Create() {
  const { creations, addCreation, removeCreation, playSong, user } = useMusicStore();
  const [pattern, setPattern] = useState<Pattern>(() => clonePattern(BEAT_PRESETS.Empty));
  const [preset, setPreset] = useState('Empty');
  const [chordLoop, setChordLoop] = useState<ChordId[]>([]);
  const [instruments, setInstruments] = useState<InstrumentToggles>({ ...DEFAULT_INSTRUMENTS });
  const [bpm, setBpm] = useState(92);
  const [playing, setPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [autotune, setAutotune] = useState(false);
  const [recording, setRecording] = useState(false);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('lo-fi chill beat soft drums');
  const [aiBusy, setAiBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const mediaRec = useRef<MediaRecorder | null>(null);
  const vocalChunks = useRef<BlobPart[]>([]);
  const engineRef = useRef<ReturnType<typeof getBeatStudio> | null>(null);

  const engine = () => {
    if (!engineRef.current) engineRef.current = getBeatStudio();
    return engineRef.current;
  };

  useEffect(() => {
    let cancelled = false;
    try {
      const e = engine();
      e.setOnStep(setActiveStep);
      e.setPattern(pattern);
      e.setChordLoop(chordLoop);
      e.setInstruments(instruments);
      e.setBpm(bpm);
      e.setAutotune(autotune);
      if (!cancelled) setReady(true);
    } catch (err) {
      console.error(err);
      if (!cancelled) toast.error('Studio engine failed to load');
    }
    return () => {
      cancelled = true;
      try {
        engineRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    engine().setPattern(pattern);
  }, [pattern, ready]);

  useEffect(() => {
    if (!ready) return;
    engine().setChordLoop(chordLoop);
  }, [chordLoop, ready]);

  useEffect(() => {
    if (!ready) return;
    engine().setInstruments(instruments);
  }, [instruments, ready]);

  useEffect(() => {
    if (!ready) return;
    engine().setBpm(bpm);
  }, [bpm, ready]);

  useEffect(() => {
    if (!ready) return;
    engine().setAutotune(autotune);
  }, [autotune, ready]);

  const toggleCell = (drum: DrumId, step: number) => {
    setPattern((prev) => {
      const next = clonePattern(prev);
      next[drum][step] = !next[drum][step];
      return next;
    });
  };

  const togglePlay = async () => {
    try {
      if (playing) {
        engine().stop();
        setPlaying(false);
        return;
      }
      await engine().play();
      setPlaying(true);
    } catch {
      toast.error('Tap again to unlock audio');
    }
  };

  const startVocalRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vocalChunks.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRec.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) vocalChunks.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(vocalChunks.current, { type: mime || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (vocalUrl) URL.revokeObjectURL(vocalUrl);
        setVocalUrl(url);
        await engine().setVocalUrl(url);
        toast.success('Vocal take saved');
      };
      rec.start();
      setRecording(true);
      toast('Recording… sing over the beat');
    } catch {
      toast.error('Microphone permission needed');
    }
  };

  const stopVocalRec = () => {
    mediaRec.current?.stop();
    setRecording(false);
  };

  const clearVocal = async () => {
    if (vocalUrl) URL.revokeObjectURL(vocalUrl);
    setVocalUrl(null);
    await engine().setVocalUrl(null);
  };

  const saveMix = async () => {
    setExporting(true);
    try {
      if (playing) {
        engine().stop();
        setPlaying(false);
      }
      const blob = await engine().recordMix(4);
      const dataUrl = await blobToDataUrl(blob);
      const name = title.trim() || `Studio Jam ${new Date().toLocaleTimeString()}`;
      const track: Track = {
        id: `studio_${Date.now()}`,
        title: name,
        artist: user.name || 'You',
        cover: coverFor(name + lyrics.slice(0, 12)),
        duration: Math.round((4 * 4 * 60) / bpm),
        streamUrl: dataUrl,
        source: 'ai',
        genre: 'Studio',
        prompt: `chords:${chordLoop.join('-') || 'none'} · ${Object.entries(instruments)
          .filter(([, on]) => on)
          .map(([k]) => k)
          .join('+') || 'drums-only'} · ${bpm}bpm`,
        createdAt: new Date().toISOString(),
      };
      // stash lyrics on album field for now
      track.album = lyrics.trim() || undefined;
      addCreation(track);
      toast.success('Saved to My creations');
      playSong(track, [track, ...creations]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const generateAi = async () => {
    setAiBusy(true);
    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const mime = data.mime || 'audio/wav';
      const streamUrl = `data:${mime};base64,${data.audioBase64}`;
      const track: Track = {
        id: `ai_${Date.now()}`,
        title: aiPrompt.slice(0, 40),
        artist: user.name || 'You',
        cover: coverFor(aiPrompt),
        duration: 12,
        streamUrl,
        source: 'ai',
        genre: 'AI',
        prompt: aiPrompt,
        createdAt: new Date().toISOString(),
      };
      addCreation(track);
      toast.success('AI loop ready');
      playSong(track, [track, ...creations]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI generate failed');
    } finally {
      setAiBusy(false);
    }
  };

  const toggleChordInLoop = (id: ChordId) => {
    setChordLoop((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((c) => c !== id);
        return next.length ? next : prev;
      }
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-5 pb-4">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-[var(--color-accent-2)]">Beat Studio</p>
        <h1 className="brand mt-1 text-3xl">Create</h1>
        <p className="mt-1 text-sm text-[var(--color-mute)]">
          Build drums, piano & guitar, add lyrics & voice — then save your mix.
        </p>
      </motion.header>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3">
        <button
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-[0_0_24px_var(--color-glow)]"
        >
          {playing ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">BPM</p>
          <input
            type="range"
            min={70}
            max={140}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
        <span className="w-10 text-center text-sm font-bold">{bpm}</span>
        <button
          disabled={exporting}
          onClick={saveMix}
          className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-black disabled:opacity-50"
        >
          {exporting ? 'Saving…' : 'Save mix'}
        </button>
      </div>

      {/* Beat presets */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">Drum beat</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.keys(BEAT_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => {
                setPreset(name);
                setPattern(clonePattern(BEAT_PRESETS[name]));
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                preset === name ? 'bg-[var(--color-accent)] text-black' : 'bg-[var(--color-elevated)] text-[var(--color-soft)]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3">
          <div className="mb-1 flex gap-1 pl-14">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-7 rounded-full ${activeStep === i && playing ? 'bg-[var(--color-accent)]' : i % 4 === 0 ? 'bg-white/30' : 'bg-white/10'}`}
              />
            ))}
          </div>
          {DRUMS.map((d) => (
            <div key={d.id} className="mb-1.5 flex items-center gap-2">
              <span className="w-12 shrink-0 text-[11px] font-bold" style={{ color: d.color }}>
                {d.label}
              </span>
              <div className="flex gap-1">
                {pattern[d.id].map((on, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPreset('Custom');
                      toggleCell(d.id, i);
                    }}
                    className={`h-7 w-7 rounded-md border transition ${
                      on
                        ? 'border-transparent'
                        : 'border-[var(--color-line)] bg-[var(--color-ink)]'
                    } ${activeStep === i && playing ? 'ring-1 ring-white/50' : ''}`}
                    style={{ background: on ? d.color : undefined }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chords */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">
            Instruments (optional)
          </h2>
          <div className="flex flex-wrap justify-end gap-1">
            {([
              ['piano', 'Piano'],
              ['guitar', 'Guitar'],
              ['violin', 'Violin'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setInstruments((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  instruments[key]
                    ? 'bg-[var(--color-accent-2)] text-black'
                    : 'bg-[var(--color-elevated)] text-[var(--color-mute)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-[11px] text-[var(--color-mute)]">
          Starts silent — turn on Piano / Guitar / Violin only if you want them.
          {chordLoop.length ? ` Loop: ${chordLoop.join(' → ')}` : ' No chords selected yet.'}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {CHORDS.map((c) => {
            const selected = chordLoop.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={async () => {
                  await engine().init();
                  engine().setInstruments(instruments);
                  engine().playChordPad(c.id);
                  toggleChordInLoop(c.id);
                }}
                className={`rounded-xl border py-4 text-sm font-extrabold transition ${
                  selected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-white'
                    : 'border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-soft)]'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {chordLoop.length > 0 && (
          <button
            className="mt-2 text-xs text-[var(--color-mute)] underline"
            onClick={() => setChordLoop([])}
          >
            Clear chord loop
          </button>
        )}
      </section>

      {/* Lyrics */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">Lyrics</h2>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={4}
          placeholder={'Write your lyrics here…\nVerse / Chorus'}
          className="w-full resize-none rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </section>

      {/* Vocals */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">
          <Music2 size={14} /> Vocals
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {!recording ? (
            <button
              onClick={startVocalRec}
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white"
            >
              <Mic size={14} /> Record voice
            </button>
          ) : (
            <button
              onClick={stopVocalRec}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
            >
              <MicOff size={14} /> Stop
            </button>
          )}
          {vocalUrl && (
            <button
              onClick={clearVocal}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-mute)]"
            >
              <Trash2 size={14} /> Clear take
            </button>
          )}
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-ink)] px-3 py-3">
          <div>
            <p className="text-sm font-semibold">Autotune effect</p>
            <p className="text-[11px] text-[var(--color-mute)]">
              Stylized pitch color (fun studio effect — not pro Antares)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutotune((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${autotune ? 'bg-[var(--color-accent-2)]' : 'bg-[var(--color-line)]'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${autotune ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </label>
        {vocalUrl && (
          <p className="mt-2 text-xs text-[var(--color-accent-2)]">Vocal take ready — hit Play to hear it on the beat</p>
        )}
      </section>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-mute)]">
          Track title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My beat"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
        />
      </div>

      {/* Optional AI */}
      <section className="rounded-2xl border border-dashed border-[var(--color-line)] p-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setAiOpen((o) => !o)}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Wand2 size={16} className="text-[var(--color-accent)]" /> Optional: AI loop (MusicGen)
          </span>
          <span className="text-xs text-[var(--color-mute)]">{aiOpen ? 'Hide' : 'Show'}</span>
        </button>
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <textarea
                className="mt-3 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2 text-sm"
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                onClick={generateAi}
                disabled={aiBusy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] py-2.5 text-sm font-bold text-black disabled:opacity-50"
              >
                {aiBusy ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                {aiBusy ? 'Generating…' : 'Generate AI clip'}
              </button>
              <p className="mt-1 text-[11px] text-[var(--color-mute)]">Needs HF_TOKEN in .env</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Creations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
          <Sparkles size={14} /> My creations
        </h2>
        {creations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-line)] p-5 text-center text-sm text-[var(--color-mute)]">
            Save a mix to hear it in your library player.
          </p>
        ) : (
          creations.map((song, i) => (
            <div key={song.id} className="relative">
              <SongRow song={song} queue={creations} showIndex index={i} />
              <div className="absolute right-14 top-1/2 flex -translate-y-1/2 gap-1">
                {song.streamUrl && (
                  <a
                    href={song.streamUrl}
                    download={`${song.title}.webm`}
                    className="rounded-full p-2 text-[var(--color-mute)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} />
                  </a>
                )}
                <button
                  className="rounded-full p-2 text-[var(--color-mute)]"
                  onClick={() => {
                    removeCreation(song.id);
                    toast('Removed');
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
