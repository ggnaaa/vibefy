import Hls from 'hls.js';
import type { Track } from '@/types/music';
import { resolveStreamUrl } from '@/services/musicService';

type EngineHandlers = {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (err: unknown) => void;
  onTime?: (current: number, duration: number) => void;
  onLoading?: (loading: boolean) => void;
};

/**
 * Single audio pipeline for Audius (often HLS) + Jamendo (mp3).
 * Never fires onError when intentionally clearing src.
 */
class AudioEngine {
  private audio: HTMLAudioElement;
  private hls: Hls | null = null;
  private handlers: EngineHandlers = {};
  private intentionalClear = false;
  private raf = 0;
  private loadedTrackId: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.addEventListener('play', () => this.handlers.onPlay?.());
    this.audio.addEventListener('pause', () => this.handlers.onPause?.());
    this.audio.addEventListener('ended', () => this.handlers.onEnded?.());
    this.audio.addEventListener('error', () => {
      if (this.intentionalClear) return;
      if (!this.audio.src || this.audio.src === window.location.href) return;
      this.handlers.onError?.(this.audio.error);
    });
    this.tick();
  }

  setHandlers(h: EngineHandlers) {
    this.handlers = h;
  }

  private tick = () => {
    if (!this.audio.paused) {
      this.handlers.onTime?.(this.audio.currentTime || 0, this.audio.duration || 0);
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  private clearSrc() {
    this.intentionalClear = true;
    this.destroyHls();
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    // Next frame: allow real errors again
    requestAnimationFrame(() => {
      this.intentionalClear = false;
    });
  }

  async load(track: Track, autoplay: boolean) {
    if (this.loadedTrackId === track.id && this.audio.src) {
      if (autoplay) await this.play();
      else this.pause();
      return;
    }

    this.handlers.onLoading?.(true);
    this.clearSrc();

    const url = await resolveStreamUrl(track);
    if (!url) {
      this.handlers.onLoading?.(false);
      this.handlers.onError?.(new Error('No stream URL'));
      return;
    }

    // Prefer progressive first (Audius stream redirects to mp3/m4a; Jamendo is mp3).
    // Fall back to HLS only when the URL looks like a playlist.
    const looksHls = url.includes('.m3u8');

    try {
      if (looksHls && Hls.isSupported()) {
        this.hls = new Hls({ enableWorker: true });
        this.hls.loadSource(url);
        this.hls.attachMedia(this.audio);
        await new Promise<void>((resolve, reject) => {
          this.hls!.once(Hls.Events.MANIFEST_PARSED, () => resolve());
          this.hls!.once(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) reject(data);
          });
        });
      } else {
        this.audio.src = url;
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onErr = () => {
            cleanup();
            reject(this.audio.error || new Error('load failed'));
          };
          const cleanup = () => {
            this.audio.removeEventListener('canplay', onReady);
            this.audio.removeEventListener('error', onErr);
          };
          this.audio.addEventListener('canplay', onReady, { once: true });
          this.audio.addEventListener('error', onErr, { once: true });
          this.audio.load();
        });
      }

      this.loadedTrackId = track.id;
      this.handlers.onLoading?.(false);
      if (autoplay) await this.play();
    } catch (e) {
      this.handlers.onLoading?.(false);
      this.handlers.onError?.(e);
    }
  }

  async play() {
    try {
      await this.audio.play();
    } catch (e) {
      this.handlers.onPause?.();
      throw e;
    }
  }

  pause() {
    this.audio.pause();
  }

  setVolume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  seek(seconds: number) {
    if (Number.isFinite(seconds)) this.audio.currentTime = seconds;
  }

  get currentTime() {
    return this.audio.currentTime || 0;
  }

  get duration() {
    return this.audio.duration || 0;
  }
}

let engine: AudioEngine | null = null;
export function getAudioEngine() {
  if (!engine) engine = new AudioEngine();
  return engine;
}
