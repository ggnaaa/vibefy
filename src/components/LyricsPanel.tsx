import { X, Sparkles, Database } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';

export default function LyricsPanel() {
  const { currentSong, currentLyrics, lyricsLoading, toggleLyrics } = useMusicStore();

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-lg flex-col bg-[var(--color-ink)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-3">
        <button className="rounded-full p-2 hover:bg-white/10" onClick={toggleLyrics}>
          <X size={22} />
        </button>
        <img src={currentSong?.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{currentSong?.title}</p>
          <p className="truncate text-xs text-[var(--color-mute)]">{currentSong?.artist}</p>
        </div>
      </div>

      {currentLyrics && !lyricsLoading && (
        <div className="mx-4 mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-soft)]">
          {currentLyrics.source === 'ai-generated' ? (
            <><Sparkles size={12} /> AI generated</>
          ) : (
            <><Database size={12} /> Lyrics database</>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {lyricsLoading && (
          <p className="text-center text-[var(--color-mute)]">Fetching lyrics…</p>
        )}
        {!lyricsLoading && currentLyrics && (
          <div className="space-y-1">
            {currentLyrics.lyrics.split('\n').map((line, i) => (
              <p key={i} className={`text-lg leading-relaxed ${line.trim() ? 'text-white/90' : 'h-4'}`}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        )}
        {!lyricsLoading && !currentLyrics && (
          <p className="text-center text-[var(--color-mute)]">No lyrics yet</p>
        )}
      </div>
    </div>
  );
}
