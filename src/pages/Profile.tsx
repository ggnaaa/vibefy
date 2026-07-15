import { useRef, useState } from 'react';
import { Camera, Check, ChevronRight, Download, Edit3, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMusicStore } from '@/store/musicStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, likedSongs, playlists, savedSongs, recentlyPlayed } = useMusicStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const share = async () => {
    const data = { title: 'Vibefy', text: 'Ad-free music on Vibefy', url: window.location.origin };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast('Link copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportProfile = () => {
    const blob = new Blob(
      [JSON.stringify({ profile: user, likedSongs, playlists, savedSongs }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibefy-${user.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported');
  };

  const join = new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="brand text-3xl">You</h1>
        <div className="flex gap-1">
          <button className="rounded-full p-2 hover:bg-white/10" onClick={share}>
            {copied ? <Check size={18} className="text-[var(--color-accent-2)]" /> : <Share2 size={18} />}
          </button>
          <button className="rounded-full p-2 hover:bg-white/10" onClick={exportProfile}>
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center text-center">
        <button className="relative mb-3" onClick={() => fileRef.current?.click()}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-elevated)] text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 rounded-full bg-[var(--color-accent)] p-1.5 text-black">
            <Camera size={12} />
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                updateUser({ avatar: String(ev.target?.result || '') });
                toast('Avatar updated');
              };
              reader.readAsDataURL(file);
            }}
          />
        </button>

        {editing ? (
          <div className="w-full max-w-sm space-y-2">
            <input
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl border border-[var(--color-line)] py-2" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-[var(--color-accent)] py-2 font-bold text-black"
                onClick={() => {
                  updateUser({ name, bio });
                  setEditing(false);
                  toast('Saved');
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <button onClick={() => setEditing(true)}><Edit3 size={14} /></button>
            </div>
            <p className="text-sm text-[var(--color-mute)]">{user.bio}</p>
            <p className="mt-1 text-xs text-[var(--color-mute)]">Since {join}</p>
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Liked', value: likedSongs.length, path: '/liked' },
          { label: 'Playlists', value: playlists.length, path: '/library' },
          { label: 'Saved', value: savedSongs.length, path: '/library?tab=saved' },
          { label: 'Played', value: recentlyPlayed.length, path: null },
        ].map((s) => (
          <button
            key={s.label}
            disabled={!s.path}
            onClick={() => s.path && navigate(s.path)}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-left disabled:opacity-70"
          >
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-[var(--color-mute)]">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {[
          { label: 'Liked songs', sub: `${likedSongs.length}`, path: '/liked' },
          { label: 'Playlists', sub: `${playlists.length}`, path: '/library' },
          { label: 'Saved', sub: `${savedSongs.length}`, path: '/library?tab=saved' },
        ].map((item) => (
          <button
            key={item.path}
            className="flex w-full items-center justify-between rounded-xl px-2 py-3 hover:bg-[var(--color-elevated)]"
            onClick={() => navigate(item.path)}
          >
            <div className="text-left">
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-[var(--color-mute)]">{item.sub}</p>
            </div>
            <ChevronRight size={18} className="text-[var(--color-mute)]" />
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <p className="mb-1 font-bold">Ad-free by design</p>
        <p className="mb-3 text-sm text-[var(--color-mute)]">
          Vibefy only plays Audius & Jamendo in-app. Missing a hit? Search opens YouTube externally — ads stay there, not here.
        </p>
        <button className="w-full rounded-full bg-white py-2.5 text-sm font-bold text-black" onClick={share}>
          Share Vibefy
        </button>
      </div>
    </div>
  );
}
