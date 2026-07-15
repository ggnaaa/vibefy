/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIUS_API_KEY: string;
  readonly VITE_JAMENDO_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
