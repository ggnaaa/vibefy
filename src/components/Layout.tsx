import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Player from '@/components/Player';
import LyricsPanel from '@/components/LyricsPanel';
import { useMusicStore } from '@/store/musicStore';

const NAV = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/create', icon: Sparkles, label: 'Create', highlight: true },
  { path: '/library', icon: Library, label: 'Library' },
  { path: '/profile', icon: User, label: 'You' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentSong, showLyrics } = useMusicStore();

  return (
    <div className="relative mx-auto flex min-h-full max-w-lg flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-[-20%] top-[-10%] h-72 w-72 rounded-full bg-[var(--color-accent)]/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[-15%] h-80 w-80 rounded-full bg-[var(--color-accent-2)]/15 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <main
        className="flex-1 px-4 pt-4"
        style={{ paddingBottom: currentSong ? 168 : 88 }}
      >
        <Outlet />
      </main>

      {currentSong && <Player />}
      {showLyrics && <LyricsPanel />}

      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-ink)_92%,transparent)] backdrop-blur-xl">
        <div className="flex items-center justify-around px-1 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
          {NAV.map(({ path, icon: Icon, label, highlight }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                  active ? 'text-[var(--color-accent)]' : 'text-[var(--color-mute)]'
                }`}
              >
                {highlight ? (
                  <motion.span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      active
                        ? 'bg-[var(--color-accent)] text-black shadow-[0_0_24px_var(--color-glow)]'
                        : 'bg-[var(--color-elevated)] text-[var(--color-accent)]'
                    }`}
                    whileTap={{ scale: 0.92 }}
                    animate={active ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    <Icon size={20} strokeWidth={2.4} />
                  </motion.span>
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                )}
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
