import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';

export default function LikedSongs() {
  const { likedSongs, playSong } = useMusicStore();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft size={22} />
        </button>
        <h1 className="brand text-2xl">Liked</h1>
      </div>

      {likedSongs.length === 0 ? (
        <div className="text-center text-[var(--color-mute)]">
          <p className="mb-3">No liked songs yet</p>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black" onClick={() => navigate('/')}>
            Discover
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] py-2.5 font-bold text-black"
              onClick={() => playSong(likedSongs[0], likedSongs)}
            >
              <Play size={16} fill="currentColor" /> Play all
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] py-2.5 font-semibold"
              onClick={() => {
                const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
                playSong(shuffled[0], shuffled);
              }}
            >
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
          {likedSongs.map((song, i) => (
            <SongRow key={song.id} song={song} queue={likedSongs} showIndex index={i} />
          ))}
        </>
      )}
    </div>
  );
}
