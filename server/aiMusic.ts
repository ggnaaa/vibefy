/**
 * Free AI music via Hugging Face Inference (MusicGen small).
 * Requires HF_TOKEN (read) — free at https://huggingface.co/settings/tokens
 * Model: facebook/musicgen-small (CC-BY-NC — non-commercial / demo OK)
 */

const MODEL = 'facebook/musicgen-small';
const ENDPOINTS = [
  `https://api-inference.huggingface.co/models/${MODEL}`,
  `https://router.huggingface.co/hf-inference/models/${MODEL}`,
];

export async function generateMusicFromPrompt(
  prompt: string,
  token: string
): Promise<{ audioBase64: string; mime: string; bytes: number }> {
  const clean = prompt.trim().slice(0, 400);
  if (!clean) throw new Error('Prompt required');
  if (!token) throw new Error('HF_TOKEN missing');

  let lastError = 'Generation failed';

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'audio/wav, audio/mpeg, application/json',
        },
        body: JSON.stringify({
          inputs: clean,
          parameters: {
            // short clip keeps free-tier latency / size reasonable
            max_new_tokens: 256,
          },
          options: { wait_for_model: true },
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (!res.ok) {
        const text = await res.text();
        lastError = text.slice(0, 240) || `HTTP ${res.status}`;
        // Model loading
        if (res.status === 503) {
          lastError = 'Model is warming up — wait ~30s and try again.';
        }
        continue;
      }

      if (contentType.includes('application/json')) {
        const data = (await res.json()) as { error?: string };
        lastError = data.error || 'Unexpected JSON response';
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const mime = contentType.includes('mpeg') || contentType.includes('mp3')
        ? 'audio/mpeg'
        : 'audio/wav';
      return {
        audioBase64: buf.toString('base64'),
        mime,
        bytes: buf.length,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Network error';
    }
  }

  throw new Error(lastError);
}
