import { generateMusicFromPrompt } from './aiMusic';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Local `/api/*` handlers so `npm run dev` works without a second process. */
export function vibefyApiPlugin(): Plugin {
  return {
    name: 'vibefy-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        if (req.method === 'GET' && req.url.startsWith('/api/health')) {
          return sendJson(res, 200, { ok: true, app: 'vibefy-dev' });
        }

        if (req.method === 'POST' && req.url.startsWith('/api/generate-music')) {
          try {
            const raw = await readBody(req);
            const { prompt } = JSON.parse(raw || '{}') as { prompt?: string };
            const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN || '';
            if (!token) {
              return sendJson(res, 503, {
                error:
                  'Add HF_TOKEN to .env (free read token from huggingface.co/settings/tokens)',
              });
            }
            const out = await generateMusicFromPrompt(prompt || '', token);
            return sendJson(res, 200, {
              audioBase64: out.audioBase64,
              mime: out.mime,
              model: 'facebook/musicgen-small',
            });
          } catch (e) {
            return sendJson(res, 502, {
              error: e instanceof Error ? e.message : 'Generate failed',
            });
          }
        }

        if (req.method === 'POST' && req.url.startsWith('/api/lyrics')) {
          try {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}') as {
              title?: string;
              artist?: string;
              genre?: string;
            };
            const key = process.env.GROQ_API_KEY;
            if (!key) return sendJson(res, 503, { error: 'GROQ_API_KEY not configured' });

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
                    content: `Write creative song lyrics for "${body.title || 'Untitled'}" by ${body.artist || 'Unknown'}. Genre: ${body.genre || 'music'}. Verses and chorus only — no commentary.`,
                  },
                ],
              }),
            });
            const data = (await response.json()) as {
              choices?: { message?: { content?: string } }[];
            };
            const lyrics = data.choices?.[0]?.message?.content;
            if (!lyrics) return sendJson(res, 502, { error: 'No lyrics' });
            return sendJson(res, 200, { lyrics, source: 'ai-generated' });
          } catch {
            return sendJson(res, 502, { error: 'Upstream failure' });
          }
        }

        return next();
      });
    },
  };
}
