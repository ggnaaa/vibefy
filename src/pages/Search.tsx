import { useRef, useState } from 'react';
import { Search as SearchIcon, X, Loader, ExternalLink, Users, Music } from 'lucide-react';
import { searchCatalog, fetchArtistTracks, youtubeSearchUrl } from '@/services/musicService';
import type { Artist, Track } from '@/types/music';
import SongRow from '@/components/SongRow';

export default function Search() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const timer = useRef<number | null>(null);

  const run = async (q: string) => {
    if (!q.trim()) {
      setTracks([]);
      setArtists([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    setSelectedArtist(null);
    const res = await searchCatalog(q, 30);
    setTracks(res.tracks);
    setArtists(res.artists);
    setLoading(false);
  };

  const onChange = (val: string) => {
    setQuery(val);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => run(val), 400);
  };

  const openArtist = async (a: Artist) => {
    setSelectedArtist(a);
    setArtistLoading(true);
    const songs = await fetchArtistTracks(a.id, 20);
    setArtistTracks(songs);
    setArtistLoading(false);
  };

  return (
    <div>
      <h1 className="brand mb-4 text-3xl">Search</h1>

      <div className="relative mb-5">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mute)]" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Songs, artists…"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] py-3 pl-10 pr-10 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-mute)]"
            onClick={() => {
              setQuery('');
              setTracks([]);
              setArtists([]);
              setSearched(false);
              setSelectedArtist(null);
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-2 py-10 text-[var(--color-mute)]">
          <Loader size={22} className="spin" />
          Searching Audius & Jamendo…
        </div>
      )}

      {!loading && selectedArtist && (
        <div>
          <button className="mb-4 text-sm text-[var(--color-accent)]" onClick={() => setSelectedArtist(null)}>
            ← Back
          </button>
          <div className="mb-4 flex flex-col items-center text-center">
            <img src={selectedArtist.picture} alt="" className="mb-3 h-28 w-28 rounded-full object-cover" />
            <h2 className="text-xl font-bold">{selectedArtist.name}</h2>
          </div>
          {artistLoading ? (
            <p className="text-center text-[var(--color-mute)]">Loading…</p>
          ) : (
            artistTracks.map((song, i) => (
              <SongRow key={song.id} song={song} queue={artistTracks} showIndex index={i} />
            ))
          )}
        </div>
      )}

      {!loading && searched && !selectedArtist && (
        <div className="space-y-6">
          {artists.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
                <Users size={14} /> Artists
              </h2>
              <div className="h-scroll">
                {artists.map((a) => (
                  <button key={a.id} className="w-[100px] shrink-0 text-center" onClick={() => openArtist(a)}>
                    <img src={a.picture} alt="" className="mx-auto mb-2 h-20 w-20 rounded-full object-cover" />
                    <p className="truncate text-xs font-semibold">{a.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-mute)]">
                <Music size={14} /> Songs ({tracks.length})
              </h2>
              {tracks.map((song, i) => (
                <SongRow key={song.id} song={song} queue={tracks} showIndex index={i} />
              ))}
            </div>
          )}

          {tracks.length === 0 && artists.length === 0 && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-6 text-center">
              <p className="mb-2 text-lg font-bold">Not in Vibefy’s ad-free catalog</p>
              <p className="mb-4 text-sm text-[var(--color-mute)]">
                Commercial hits aren’t licensed for in-app play here. You can look them up on YouTube outside Vibefy.
              </p>
              <a
                href={youtubeSearchUrl(query)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
              >
                Open on YouTube <ExternalLink size={14} />
              </a>
            </div>
          )}

          {tracks.length > 0 && (
            <a
              href={youtubeSearchUrl(query)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] py-3 text-sm text-[var(--color-mute)] hover:text-white"
            >
              Also search YouTube (opens externally) <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {!searched && !loading && (
        <p className="text-sm text-[var(--color-mute)]">
          Search the open Audius catalog and Jamendo CC tracks. Playback stays ad-free in Vibefy.
        </p>
      )}
    </div>
  );
}
