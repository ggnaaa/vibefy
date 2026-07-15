---
title: Vibefy
emoji: 🎵
colorFrom: red
colorTo: green
sdk: static
app_build_command: npm run build
app_file: dist/index.html
pinned: false
---

# Vibefy — Create · Listen · Enjoy

Free **Static** Space deploy (Docker Spaces may require a paid HF plan).

Ad-free music: **Audius** + **Jamendo**, plus in-browser **Beat Studio** (drums, piano, guitar, violin, vocals).

## Local

```bash
npm install
cp .env.example .env
npm run dev   # http://localhost:5000
```

## Deploy on Hugging Face (FREE — choose Static)

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. **SDK: Static** (not Docker — Docker is paid on some accounts)
3. Create the Space, then push this repo to it
4. Optional Space **variable**: `VITE_HF_TOKEN` = HF read token (only for optional MusicGen AI loop)
5. Optional: `VITE_JAMENDO_CLIENT_ID`
6. Open `https://huggingface.co/spaces/<you>/<space>`

App uses hash routes (`/#/create`) so Static hosting works.

### What works on Static (free)
| Feature | Works? |
|---|---|
| Listen / search (Audius, Jamendo) | Yes |
| Beat Studio (drums, piano, guitar, violin, mic) | Yes |
| Save / like / playlists | Yes (in browser) |
| Optional MusicGen AI loop | Needs `VITE_HF_TOKEN` variable |

## Notes

- Beat Studio needs **no** paid API and **no** Docker.
- `VITE_HF_TOKEN` is baked into the frontend at build time — use a **read** token and rotate if abused.
- `Dockerfile` remains in the repo if you upgrade to paid Docker later.

## Stack

Vite 6 · React 19 · TypeScript · Tailwind 4 · Tone.js · Zustand · Framer Motion
