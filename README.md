---
title: Vibefy
emoji: 🎵
colorFrom: red
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Vibefy — Create · Listen · Enjoy

Ad-free music app: stream **Audius** + **Jamendo**, and **create AI tracks** with free Hugging Face MusicGen.

## Local

```bash
npm install
cp .env.example .env
# Add HF_TOKEN (free): https://huggingface.co/settings/tokens
npm run dev   # http://localhost:5000
```

## Public deploy (Hugging Face Spaces — free)

1. Create a **Docker** Space at [huggingface.co/new-space](https://huggingface.co/new-space)
2. Push this repo to the Space
3. **Settings → Secrets**: `HF_TOKEN` = your HF read token (needed for Create)
4. **Variables** (optional): `VITE_JAMENDO_CLIENT_ID`, `VITE_AUDIUS_API_KEY`
5. Optional secrets: `GROQ_API_KEY`
6. Share `https://huggingface.co/spaces/<you>/<space>`

## What people can do

| Feature | Source | Ads? |
|---|---|---|
| Trending / search / play | Audius + Jamendo | No |
| Create AI song | MusicGen (HF free tier) | No |
| Save / like / playlists | Local on device | No |
| Famous commercial hits | “Open on YouTube” externally | Outside app |

## Notes

- MusicGen clips are short instrumentals; first generation may take 30–60s (cold start).
- Model license is **CC-BY-NC** — fine for personal / portfolio / non-commercial demos.
- Free HF Inference has rate limits; for heavy traffic upgrade HF or self-host later.

## Stack

Vite 6 · React 19 · TypeScript · Tailwind 4 · Framer Motion · Zustand · hls.js · Hono · MusicGen · Docker
