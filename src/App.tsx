import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import Create from '@/pages/Create';
import Library from '@/pages/Library';
import Profile from '@/pages/Profile';
import LikedSongs from '@/pages/LikedSongs';
import SavedSongs from '@/pages/SavedSongs';
import PlaylistView from '@/pages/PlaylistView';

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="create" element={<Create />} />
          <Route path="library" element={<Library />} />
          <Route path="profile" element={<Profile />} />
          <Route path="liked" element={<LikedSongs />} />
          <Route path="saved" element={<SavedSongs />} />
          <Route path="playlist/:id" element={<PlaylistView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1c1c22',
            color: '#fff',
            border: '1px solid #2a2a32',
            borderRadius: '14px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
          },
        }}
      />
    </div>
  );
}
