/** Client-side MusicGen (for free Static Spaces — no Docker server). */

const MODEL = 'facebook/musicgen-small';
const ENDPOINTS = [
  `https://api-inference.huggingface.co/models/${MODEL}`,
  `https://router.huggingface.co/hf-inference/models/${MODEL}`,
];

function getHfToken(): string {
  const fromEnv = import.meta.env.VITE_HF_TOKEN || '';
  try {
    const w = window as unknown as {
      huggingface?: { variables?: Record<string, string> };
    };
    return (
      fromEnv ||
      w.huggingface?.variables?.HF_TOKEN ||
      w.huggingface?.variables?.VITE_HF_TOKEN ||
      ''
    );
  } catch {
    return fromEnv;
  }
}

export async function generateMusicClip(prompt: string): Promise<{
  audioBase64: string;
  mime: string;
}> {
  const clean = prompt.trim().slice(0, 400);
  if (!clean) throw new Error('Prompt required');

  // Prefer local/Docker API if available
  try {
    const res = await fetch('/api/generate-music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: clean }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        return { audioBase64: data.audioBase64, mime: data.mime || 'audio/wav' };
      }
    }
  } catch {
    /* fall through to browser HF call */
  }

  const token = getHfToken();
  if (!token) {
    throw new Error(
      'Add VITE_HF_TOKEN in Space variables (HF read token) for AI loops — Beat Studio works without it.'
    );
  }

  let lastError = 'Generation failed';
  for (const url of ENDPOINTS) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'audio/wav, audio/mpeg, application/json',
      },
      body: JSON.stringify({
        inputs: clean,
        parameters: { max_new_tokens: 256 },
        options: { wait_for_model: true },
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const text = await res.text();
      lastError =
        res.status === 503
          ? 'Model warming up — wait ~30s and try again.'
          : text.slice(0, 200) || `HTTP ${res.status}`;
      continue;
    }
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as { error?: string };
      lastError = data.error || 'Unexpected JSON';
      continue;
    }

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const audioBase64 = btoa(binary);
    const mime =
      contentType.includes('mpeg') || contentType.includes('mp3')
        ? 'audio/mpeg'
        : 'audio/wav';
    return { audioBase64, mime };
  }

  throw new Error(lastError);
}
