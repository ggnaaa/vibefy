import * as Tone from 'tone';

export type DrumId = 'kick' | 'snare' | 'hat' | 'clap';
export type ChordId = 'C' | 'Dm' | 'Em' | 'F' | 'G' | 'Am' | 'Bb';

export const STEPS = 16;
export const DRUMS: { id: DrumId; label: string; color: string }[] = [
  { id: 'kick', label: 'Kick', color: '#ff5a36' },
  { id: 'snare', label: 'Snare', color: '#5b8cff' },
  { id: 'hat', label: 'Hi-hat', color: '#3dff9a' },
  { id: 'clap', label: 'Clap', color: '#ffb020' },
];

export const CHORDS: {
  id: ChordId;
  label: string;
  notes: string[];
  guitar: string[];
  violin: string[];
}[] = [
  { id: 'C', label: 'C', notes: ['C3', 'E3', 'G3', 'C4'], guitar: ['C3', 'E3', 'G3', 'C4', 'E4'], violin: ['G4', 'C5', 'E5'] },
  { id: 'Dm', label: 'Dm', notes: ['D3', 'F3', 'A3', 'D4'], guitar: ['D3', 'A3', 'D4', 'F4'], violin: ['A4', 'D5', 'F5'] },
  { id: 'Em', label: 'Em', notes: ['E3', 'G3', 'B3', 'E4'], guitar: ['E3', 'B3', 'E4', 'G4'], violin: ['B4', 'E5', 'G5'] },
  { id: 'F', label: 'F', notes: ['F3', 'A3', 'C4', 'F4'], guitar: ['F3', 'C4', 'F4', 'A4'], violin: ['A4', 'C5', 'F5'] },
  { id: 'G', label: 'G', notes: ['G2', 'B2', 'D3', 'G3'], guitar: ['G2', 'B2', 'D3', 'G3', 'B3'], violin: ['G4', 'B4', 'D5'] },
  { id: 'Am', label: 'Am', notes: ['A2', 'C3', 'E3', 'A3'], guitar: ['A2', 'E3', 'A3', 'C4'], violin: ['A4', 'C5', 'E5'] },
  { id: 'Bb', label: 'Bb', notes: ['A#2', 'D3', 'F3', 'A#3'], guitar: ['A#2', 'F3', 'A#3', 'D4'], violin: ['A#4', 'D5', 'F5'] },
];

export type InstrumentToggles = {
  piano: boolean;
  guitar: boolean;
  violin: boolean;
};

export const DEFAULT_INSTRUMENTS: InstrumentToggles = {
  piano: false,
  guitar: false,
  violin: false,
};

export const BEAT_PRESETS: Record<string, Record<DrumId, boolean[]>> = {
  'Hip-Hop': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0].map(Boolean),
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1].map(Boolean),
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0].map(Boolean),
  },
  House: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0].map(Boolean),
    clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
  },
  Rock: {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0].map(Boolean),
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
    hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map(Boolean),
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(Boolean),
  },
  Empty: {
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hat: Array(16).fill(false),
    clap: Array(16).fill(false),
  },
};

export type Pattern = Record<DrumId, boolean[]>;

function emptyPattern(): Pattern {
  return {
    kick: Array(STEPS).fill(false),
    snare: Array(STEPS).fill(false),
    hat: Array(STEPS).fill(false),
    clap: Array(STEPS).fill(false),
  };
}

export class BeatStudioEngine {
  private started = false;
  private master!: Tone.Gain;
  private kick!: Tone.MembraneSynth;
  private snare!: Tone.NoiseSynth;
  private hat!: Tone.NoiseSynth;
  private clap!: Tone.NoiseSynth;
  private piano!: Tone.PolySynth;
  private guitar!: Tone.PolySynth;
  private violin!: Tone.PolySynth;
  private vocalPlayer: Tone.Player | null = null;
  private pitchShift!: Tone.PitchShift;
  private vocalGain!: Tone.Gain;
  private pattern: Pattern = emptyPattern();
  private chordLoop: ChordId[] = [];
  private instruments: InstrumentToggles = { ...DEFAULT_INSTRUMENTS };
  private step = 0;
  private onStep?: (step: number) => void;
  private autotune = false;
  private scheduleId: number | null = null;

  async init() {
    if (this.started) return;
    await Tone.start();

    this.master = new Tone.Gain(0.9).toDestination();

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
    }).connect(this.master);

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(this.master);

    this.hat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    }).connect(this.master);
    this.hat.volume.value = -22;

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).connect(this.master);
    this.clap.volume.value = -8;

    this.piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.35, release: 0.8 },
    }).connect(this.master);
    this.piano.volume.value = -10;

    this.guitar = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.2, release: 0.4 },
    }).connect(this.master);
    this.guitar.volume.value = -14;

    // Soft bowed-string feel for violin
    this.violin = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.12, decay: 0.2, sustain: 0.7, release: 1.2 },
    }).connect(this.master);
    this.violin.volume.value = -8;

    this.pitchShift = new Tone.PitchShift({ pitch: 0, windowSize: 0.08 });
    this.vocalGain = new Tone.Gain(0.95).connect(this.master);
    this.pitchShift.connect(this.vocalGain);

    this.scheduleId = Tone.getTransport().scheduleRepeat((time) => {
      const s = this.step % STEPS;
      this.onStep?.(s);
      this.triggerStep(s, time);
      this.step = (this.step + 1) % STEPS;
    }, '16n');

    Tone.getTransport().bpm.value = 92;
    this.started = true;
  }

  setOnStep(cb: (step: number) => void) {
    this.onStep = cb;
  }

  setPattern(p: Pattern) {
    this.pattern = p;
  }

  setChordLoop(chords: ChordId[]) {
    // Empty = no auto chords (silent until user picks)
    this.chordLoop = chords;
  }

  setInstruments(flags: InstrumentToggles) {
    this.instruments = { ...flags };
  }

  private anyInstrumentOn() {
    return this.instruments.piano || this.instruments.guitar || this.instruments.violin;
  }

  setBpm(bpm: number) {
    try {
      Tone.getTransport().bpm.value = bpm;
    } catch {
      /* context not ready yet — applied on init/play */
    }
  }

  setAutotune(on: boolean) {
    this.autotune = on;
    if (!this.started || !this.pitchShift) return;
    this.pitchShift.windowSize = on ? 0.03 : 0.1;
    this.pitchShift.pitch = on ? 1 : 0;
  }

  async setVocalUrl(url: string | null) {
    if (this.vocalPlayer) {
      this.vocalPlayer.dispose();
      this.vocalPlayer = null;
    }
    if (!url) return;
    await this.init();
    this.vocalPlayer = new Tone.Player({ url, loop: true });
    this.vocalPlayer.connect(this.pitchShift);
    await Tone.loaded();
  }

  private triggerStep(s: number, time: number) {
    if (this.pattern.kick[s]) this.kick.triggerAttackRelease('C1', '8n', time);
    if (this.pattern.snare[s]) this.snare.triggerAttackRelease('16n', time);
    if (this.pattern.hat[s]) this.hat.triggerAttackRelease('32n', time);
    if (this.pattern.clap[s]) this.clap.triggerAttackRelease('16n', time);

    if (!this.chordLoop.length || !this.anyInstrumentOn()) return;

    if (s % 4 === 0) {
      const chordIndex = Math.floor(s / 4) % this.chordLoop.length;
      const chord = CHORDS.find((c) => c.id === this.chordLoop[chordIndex]);
      if (!chord) return;
      if (this.instruments.piano) {
        this.piano.triggerAttackRelease(chord.notes, '4n', time);
      }
      if (this.instruments.guitar) {
        this.guitar.triggerAttackRelease(chord.guitar, '8n', time + 0.02);
      }
      if (this.instruments.violin) {
        this.violin.triggerAttackRelease(chord.violin, '2n', time);
      }
    }
  }

  playChordPad(id: ChordId) {
    const chord = CHORDS.find((c) => c.id === id);
    if (!chord) return;
    const now = Tone.now();
    // If nothing selected, preview piano so the pad still audibly responds
    const usePiano = this.instruments.piano || !this.anyInstrumentOn();
    if (usePiano) this.piano.triggerAttackRelease(chord.notes, '2n', now);
    if (this.instruments.guitar) this.guitar.triggerAttackRelease(chord.guitar, '4n', now + 0.01);
    if (this.instruments.violin) this.violin.triggerAttackRelease(chord.violin, '2n', now);
  }

  async play() {
    await this.init();
    this.step = 0;
    if (this.pitchShift) {
      this.pitchShift.pitch = this.autotune ? 2 : 0;
      this.pitchShift.windowSize = this.autotune ? 0.03 : 0.1;
    }
    if (this.vocalPlayer?.loaded) this.vocalPlayer.start();
    Tone.getTransport().start();
  }

  stop() {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.step = 0;
    this.onStep?.(0);
    try {
      this.vocalPlayer?.stop();
    } catch {
      /* already stopped */
    }
  }

  async recordMix(bars = 4): Promise<Blob> {
    await this.init();
    const recorder = new Tone.Recorder();
    this.master.connect(recorder);

    this.stop();
    this.step = 0;
    this.pitchShift.pitch = this.autotune ? 2 : 0;

    await recorder.start();
    if (this.vocalPlayer?.loaded) this.vocalPlayer.start();
    Tone.getTransport().start();

    const ms = (bars * 4 * 60 * 1000) / Tone.getTransport().bpm.value;
    await new Promise((r) => setTimeout(r, ms + 150));

    this.stop();
    const recording = await recorder.stop();
    this.master.disconnect(recorder);
    recorder.dispose();
    return recording;
  }
}

let engine: BeatStudioEngine | null = null;
export function getBeatStudio() {
  if (!engine) engine = new BeatStudioEngine();
  return engine;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
