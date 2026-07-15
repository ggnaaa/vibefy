import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { vibefyApiPlugin } from './server/viteApiPlugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.HF_TOKEN = process.env.HF_TOKEN || env.HF_TOKEN || '';
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';

  return {
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['tone', 'framer-motion'],
    },
    plugins: [
      react(),
      tailwindcss(),
      vibefyApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'logo192.png', 'logo512.png'],
        manifest: {
          name: 'Vibefy',
          short_name: 'Vibefy',
          description: 'Create, listen & enjoy — ad-free music + AI tracks',
          theme_color: '#0c0c0e',
          background_color: '#0c0c0e',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.(audius|jamendo)\./i,
              handler: 'NetworkFirst',
              options: { cacheName: 'music-api', networkTimeoutSeconds: 8 },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      port: 5000,
    },
  };
});
