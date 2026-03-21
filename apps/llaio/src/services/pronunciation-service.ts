import type { Language } from '@/stores/language-store';

const DEFAULT_PROXY_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://llaio-api.vercel.app';

const proxyApiBaseUrl =
  import.meta.env.VITE_PROXY_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_PROXY_API_BASE_URL;

const PRONUNCIATION_API_URL = `${proxyApiBaseUrl}/api/pronunciation`;

export interface PlayPronunciationResult {
  ok: boolean;
  audioUrl?: string;
  error?: string;
}

export async function playPronunciation(
  word: string,
  targetLanguage: Language,
): Promise<PlayPronunciationResult> {
  const trimmedWord = word.trim();
  if (!trimmedWord) {
    return { ok: false, error: 'Please enter a word first.' };
  }

  try {
    const response = await fetch(PRONUNCIATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmedWord,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Unable to generate pronunciation audio right now. Please try again.';

      try {
        const payload = (await response.json()) as { error?: string };
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          errorMessage = payload.error;
        }
      } catch {
        // ignore invalid JSON payloads
      }

      return {
        ok: false,
        error: errorMessage,
      };
    }

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) {
      return {
        ok: false,
        error: 'Pronunciation audio was empty. Please try again.',
      };
    }

    return {
      ok: true,
      audioUrl: URL.createObjectURL(audioBlob),
    };
  } catch {
    return {
      ok: false,
      error: 'Unable to connect to pronunciation service right now. Please try again.',
    };
  }
}
