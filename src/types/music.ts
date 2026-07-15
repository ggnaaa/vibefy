export type TrackSource = 'audius' | 'jamendo' | 'ai';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  cover: string;
  duration: number;
  streamUrl?: string;
  streamId?: string;
  genre?: string;
  source: TrackSource;
  permalink?: string;
  prompt?: string;
  createdAt?: string;
}

export interface Artist {
  id: string;
  name: string;
  picture: string;
  followerCount?: number;
  source: TrackSource;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  cover: string;
  trackCount: number;
  source: TrackSource;
}

export type RepeatMode = 'none' | 'one' | 'all';

export interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  songs: Track[];
  color: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  avatar: string | null;
  bio: string;
  joinDate: string;
}
