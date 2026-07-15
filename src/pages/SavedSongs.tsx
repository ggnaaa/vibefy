import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '@/store/musicStore';
import SongRow from '@/components/SongRow';

export default function SavedSongs() {
  const { savedSongs } = useMusicStore();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft size={22} />
        </button>
        <h1 className="brand text-2xl">Saved</h1>
      </div>
      {savedSongs.length === 0 ? (
        <p className="text-[var(--color-mute)]">Nothing saved yet.</p>
      ) : (
        savedSongs.map((song, i) => (
          <SongRow key={song.id} song={song} queue={savedSongs} showIndex index={i} />
        ))
      )}
    </div>
  );
}
