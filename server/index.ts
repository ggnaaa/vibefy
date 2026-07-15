import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const app = new Hono();
app.use('/api/*', cors());

app.get('/api/health', (c) => c.json({ ok: true, app: 'vibefy' }));

app.post('/api/generate-music', async (c) => {
  const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN || '';
  if (!token) {
    return c.json(
      {
        error:
          'Add HF_TOKEN secret (free read token from huggingface.co/settings/tokens)',
      },
      503
    );
  }

  try {
    const body = await c.req.json<{ prompt?: string }>();
    const { generateMusicFromPrompt } = await import('./aiMusic.js');
    const out = await generateMusicFromPrompt(body.prompt || '', token);
    return c.json({
      audioBase64: out.audioBase64,
      mime: out.mime,
      model: 'facebook/musicgen-small',
    });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : 'Generate failed' },
      502
    );
  }
});

app.post('/api/lyrics', async (c) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return c.json({ error: 'GROQ_API_KEY not configured' }, 503);
  }

  const body = await c.req.json<{ title?: string; artist?: string; genre?: string }>();
  const title = body.title || 'Untitled';
  const artist = body.artist || 'Unknown';
  const genre = body.genre || 'music';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Write creative song lyrics for "${title}" by ${artist}. Genre: ${genre}. Verses and chorus only — no commentary.`,
          },
        ],
      }),
    });
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const lyrics = data.choices?.[0]?.message?.content;
    if (!lyrics) return c.json({ error: 'No lyrics' }, 502);
    return c.json({ lyrics, source: 'ai-generated' });
  } catch {
    return c.json({ error: 'Upstream failure' }, 502);
  }
});

app.get('/api/youtube/search', async (c) => {
  const q = c.req.query('q') || '';
  const key = process.env.YOUTUBE_API_KEY;
  const openUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  if (!key || !q) return c.json({ openUrl, items: [] });

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('q', q);
    url.searchParams.set('key', key);
    const res = await fetch(url);
    const data = (await res.json()) as {
      items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
    };
    const items = (data.items || [])
      .filter((i) => i.id?.videoId)
      .map((i) => ({
        videoId: i.id!.videoId!,
        title: i.snippet?.title || '',
        channel: i.snippet?.channelTitle || '',
        url: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
      }));
    return c.json({ openUrl, items });
  } catch {
    return c.json({ openUrl, items: [] });
  }
});

app.use('/*', serveStatic({ root: distDir }));

app.get('*', (c) => {
  const indexPath = path.join(distDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  return c.html(html);
});

const port = Number(process.env.PORT || 7860);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Vibefy listening on :${port}`);
});
