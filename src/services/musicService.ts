import type { Artist, Track } from '@/types/music';

const APP_NAME = 'Vibefy';
const JAMENDO_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || '';
const AUDIUS_KEY = import.meta.env.VITE_AUDIUS_API_KEY || '';

/** Discovery hosts — try until one responds (no key required for public reads). */
const AUDIUS_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
  'https://api.audius.co',
];

let cachedHost: string | null = null;

async function audiusFetch(path: string): Promise<Response> {
  const hosts = cachedHost ? [cachedHost, ...AUDIUS_HOSTS.filter((h) => h !== cachedHost)] : AUDIUS_HOSTS;
  let lastErr: unknown;

  for (const host of hosts) {
    try {
      const url = new URL(path, host);
      if (!url.searchParams.has('app_name')) url.searchParams.set('app_name', APP_NAME);
      const headers: HeadersInit = { Accept: 'application/json' };
      if (AUDIUS_KEY) headers['Authorization'] = `Bearer ${AUDIUS_KEY}`;

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        cachedHost = host;
        return res;
      }
      lastErr = new Error(`${host} → ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Audius unavailable');
}

function coverFromArtwork(artwork?: Record<string, string> | null, fallbackId = 'x'): string {
  if (!artwork) return `https://picsum.photos/seed/${fallbackId}/400/400`;
  return (
    artwork['480x480'] ||
    artwork['1000x1000'] ||
    artwork['150x150'] ||
    Object.values(artwork)[0] ||
    `https://picsum.photos/seed/${fallbackId}/400/400`
  );
}

function mapAudiusTrack(t: Record<string, unknown>): Track | null {
  const id = String(t.id ?? t.track_id ?? '');
  if (!id) return null;
  const user = (t.user as Record<string, unknown>) || {};
  const artwork = t.artwork as Record<string, string> | undefined;
  const title = String(t.title || 'Untitled');
  const artist = String(user.name || user.handle || 'Unknown');

  return {
    id: `audius_${id}`,
    title,
    artist,
    artistId: user.id ? String(user.id) : undefined,
    cover: coverFromArtwork(artwork, id),
    duration: Number(t.duration || 0),
    streamId: id,
    genre: t.genre ? String(t.genre) : undefined,
    source: 'audius',
    permalink: t.permalink ? `https://audius.co${t.permalink}` : undefined,
  };
}

function mapJamendoTrack(t: Record<string, unknown>): Track | null {
  const id = String(t.id ?? '');
  const audio = String(t.audio || '');
  if (!id || !audio) return null;
  const info = t.musicinfo as { tags?: { genres?: string[] } } | undefined;
  return {
    id: `jam_${id}`,
    title: String(t.name || 'Untitled'),
    artist: String(t.artist_name || 'Unknown'),
    album: t.album_name ? String(t.album_name) : undefined,
    cover: String(t.album_image || t.image || `https://picsum.photos/seed/${id}/400/400`),
    duration: Number(t.duration || 0),
    streamUrl: audio,
    genre: info?.tags?.genres?.[0],
    source: 'jamendo',
  };
}

export async function resolveStreamUrl(track: Track): Promise<string | null> {
  if (track.streamUrl) return track.streamUrl;
  if (track.source === 'audius' && track.streamId) {
    // Prefer a known-good discovery host; browser will follow redirects to CDN media
    const host = cachedHost || AUDIUS_HOSTS[0];
    const url = new URL(`/v1/tracks/${track.streamId}/stream`, host);
    url.searchParams.set('app_name', APP_NAME);
    return url.toString();
  }
  return null;
}

export async function fetchTrending(limit = 20): Promise<Track[]> {
  try {
    const res = await audiusFetch(`/v1/tracks/trending?limit=${limit}`);
    const data = await res.json();
    return (data.data || []).map(mapAudiusTrack).filter(Boolean) as Track[];
  } catch (e) {
    console.error('fetchTrending', e);
    return fetchCcPicks(limit);
  }
}

export async function fetchUnderground(limit = 20): Promise<Track[]> {
  try {
    const res = await audiusFetch(`/v1/tracks/trending/underground?limit=${limit}`);
    const data = await res.json();
    return (data.data || []).map(mapAudiusTrack).filter(Boolean) as Track[];
  } catch {
    return [];
  }
}

export async function searchCatalog(query: string, limit = 25): Promise<{ tracks: Track[]; artists: Artist[] }> {
  if (!query.trim()) return { tracks: [], artists: [] };

  const [audiusTracks, audiusUsers, jamendo] = await Promise.all([
    (async () => {
      try {
        const res = await audiusFetch(
          `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`
        );
        const data = await res.json();
        return (data.data || []).map(mapAudiusTrack).filter(Boolean) as Track[];
      } catch {
        return [] as Track[];
      }
    })(),
    (async () => {
      try {
        const res = await audiusFetch(
          `/v1/users/search?query=${encodeURIComponent(query)}&limit=6`
        );
        const data = await res.json();
        return ((data.data || []) as Record<string, unknown>[]).map((u) => ({
          id: `audius_user_${u.id}`,
          name: String(u.name || u.handle || 'Artist'),
          picture: coverFromArtwork(u.profile_picture as Record<string, string>, String(u.id)),
          followerCount: Number(u.follower_count || 0),
          source: 'audius' as const,
        }));
      } catch {
        return [] as Artist[];
      }
    })(),
    searchJamendo(query, 10),
  ]);

  // Dedupe by title+artist loosely, prefer Audius
  const seen = new Set<string>();
  const tracks: Track[] = [];
  for (const t of [...audiusTracks, ...jamendo]) {
    const key = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tracks.push(t);
  }

  return { tracks, artists: audiusUsers };
}

export async function fetchArtistTracks(artistId: string, limit = 20): Promise<Track[]> {
  const id = artistId.replace(/^audius_user_/, '');
  try {
    const res = await audiusFetch(`/v1/users/${id}/tracks?limit=${limit}`);
    const data = await res.json();
    return (data.data || []).map(mapAudiusTrack).filter(Boolean) as Track[];
  } catch {
    return [];
  }
}

export async function fetchCcPicks(limit = 16): Promise<Track[]> {
  if (!JAMENDO_ID) return [];
  try {
    const res = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_ID}&format=json&limit=${limit}&order=popularity_total&include=musicinfo&audioformat=mp32`
    );
    const data = await res.json();
    return (data.results || []).map(mapJamendoTrack).filter(Boolean) as Track[];
  } catch {
    return [];
  }
}

async function searchJamendo(query: string, limit: number): Promise<Track[]> {
  if (!JAMENDO_ID) return [];
  try {
    const res = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_ID}&format=json&limit=${limit}&search=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`
    );
    const data = await res.json();
    return (data.results || []).map(mapJamendoTrack).filter(Boolean) as Track[];
  } catch {
    return [];
  }
}

export const MOODS = [
  { name: 'Electronic', query: 'electronic' },
  { name: 'Hip-Hop', query: 'hip-hop' },
  { name: 'Lo-Fi', query: 'lofi' },
  { name: 'Indie', query: 'indie' },
  { name: 'R&B', query: 'r&b' },
  { name: 'Ambient', query: 'ambient' },
  { name: 'Pop', query: 'pop' },
  { name: 'Rock', query: 'rock' },
] as const;

export async function fetchByMood(query: string, limit = 15): Promise<Track[]> {
  const { tracks } = await searchCatalog(query, limit);
  return tracks;
}

export async function fetchLyrics(artist: string, title: string) {
  try {
    const cleanArtist = artist.replace(/[^\w\s]/gi, '').trim();
    const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.lyrics && data.lyrics.length > 10) {
      return { lyrics: data.lyrics as string, source: 'database' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateAILyrics(track: Track) {
  try {
    const res = await fetch('/api/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: track.title,
        artist: track.artist,
        genre: track.genre,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.lyrics) return { lyrics: data.lyrics as string, source: 'ai-generated' };
    return null;
  } catch {
    return null;
  }
}

/** External YouTube search — opens outside Vibefy (ad-free in-app policy). */
export function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
