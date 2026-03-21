import { GoogleAuth } from "google-auth-library";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { TTS_LANGUAGE_CODES, type TtsTargetLanguage } from "./config";

const REQUEST_TIMEOUT_MS = 15000;
const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
const MAX_TEXT_BYTES = 5000;
const PRONUNCIATION_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2;
const PRONUNCIATION_CACHE_CONTROL = `public, max-age=${PRONUNCIATION_CACHE_TTL_MS / 1000}`;
const MAX_CACHE_ENTRIES = 500;

const FALLBACK_VOICES: Record<TtsTargetLanguage, string[]> = {
  English: ["en-US-Neural2-F", "en-US-Wavenet-D", "en-US-Standard-C"],
  Spanish: ["es-ES-Neural2-F", "es-ES-Wavenet-B", "es-ES-Standard-B"],
  French: ["fr-FR-Neural2-F", "fr-FR-Wavenet-C", "fr-FR-Standard-C"],
  German: ["de-DE-Neural2-F", "de-DE-Wavenet-F", "de-DE-Standard-F"],
  Japanese: ["ja-JP-Neural2-B", "ja-JP-Wavenet-B", "ja-JP-Standard-B"],
  Italian: ["it-IT-Neural2-A", "it-IT-Wavenet-A", "it-IT-Standard-A"],
  Chinese: ["cmn-CN-Wavenet-A", "cmn-CN-Standard-A"],
  Vietnamese: ["vi-VN-Neural2-A", "vi-VN-Wavenet-A", "vi-VN-Standard-A"],
};

const DEFAULT_GOOGLE_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const GOOGLE_SERVICE_ACCOUNT_JSON_ENV = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
const GOOGLE_SERVICE_ACCOUNT_B64_ENV = "GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64";
const GOOGLE_QUOTA_PROJECT_ENV = "GOOGLE_CLOUD_QUOTA_PROJECT";

export interface ServiceAccountCredentials {
  type?: string;
  client_email?: string;
  private_key?: string;
  project_id?: string;
  quota_project_id?: string;
}

export interface PronunciationPayload {
  text: string;
  targetLanguage: string;
}

export interface PronunciationResult {
  status: number;
  headers: Record<string, string>;
  body?: Buffer;
  json?: Record<string, string>;
}

export interface PronunciationDependencies {
  getAccessToken?: () => Promise<string>;
  fetchImpl?: FetchLike;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface CachedPronunciation {
  audio: Buffer;
  expiresAt: number;
}

const pronunciationCache = new Map<string, CachedPronunciation>();

interface GoogleSynthesisResult {
  ok: boolean;
  status?: number;
  body?: Buffer;
  error?: string;
}

function isTargetLanguage(value: string): value is TtsTargetLanguage {
  return Object.hasOwn(TTS_LANGUAGE_CODES, value);
}

function validatePayload(payload: PronunciationPayload): {
  text?: string;
  targetLanguage?: TtsTargetLanguage;
  error?: string;
} {
  const text = payload.text?.trim();
  if (!text) {
    return { error: "Missing text" };
  }

  const textBytes = Buffer.byteLength(text, "utf8");
  if (textBytes > MAX_TEXT_BYTES) {
    return { error: "Text exceeds 5000-byte limit" };
  }

  if (!isTargetLanguage(payload.targetLanguage)) {
    return { error: "Unsupported targetLanguage" };
  }

  return {
    text,
    targetLanguage: payload.targetLanguage,
  };
}

function parseServiceAccountCredentials(raw: string): ServiceAccountCredentials | null {
  try {
    const parsed = JSON.parse(raw) as ServiceAccountCredentials;
    if (!parsed.client_email || !parsed.private_key) {
      return null;
    }

    return {
      ...parsed,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

function readQuotaProjectFromAdcFile(): string | undefined {
  const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? process.env.GOOGLE_APPLICATION_CREDENTIALS
    : join(homedir(), ".config", "gcloud", "application_default_credentials.json");

  try {
    if (!existsSync(adcPath)) {
      return undefined;
    }

    const raw = readFileSync(adcPath, "utf8");
    const parsed = JSON.parse(raw) as { quota_project_id?: string };
    if (typeof parsed.quota_project_id !== "string" || parsed.quota_project_id.trim().length === 0) {
      return undefined;
    }

    return parsed.quota_project_id.trim();
  } catch {
    return undefined;
  }
}

function resolveQuotaProjectId(credentials: ServiceAccountCredentials | null): string | undefined {
  const envQuotaProject = process.env[GOOGLE_QUOTA_PROJECT_ENV];
  if (typeof envQuotaProject === "string" && envQuotaProject.trim().length > 0) {
    return envQuotaProject.trim();
  }

  const envProject = process.env.GOOGLE_CLOUD_PROJECT;
  if (typeof envProject === "string" && envProject.trim().length > 0) {
    return envProject.trim();
  }

  if (typeof credentials?.quota_project_id === "string" && credentials.quota_project_id.trim().length > 0) {
    return credentials.quota_project_id.trim();
  }

  if (typeof credentials?.project_id === "string" && credentials.project_id.trim().length > 0) {
    return credentials.project_id.trim();
  }

  return readQuotaProjectFromAdcFile();
}

export function resolveServiceAccountCredentialsFromEnv(): ServiceAccountCredentials | null {
  const rawInlineJson = process.env[GOOGLE_SERVICE_ACCOUNT_JSON_ENV];
  if (rawInlineJson && rawInlineJson.trim().length > 0) {
    const credentials = parseServiceAccountCredentials(rawInlineJson);
    if (credentials) {
      return credentials;
    }
  }

  const rawBase64 = process.env[GOOGLE_SERVICE_ACCOUNT_B64_ENV];
  if (rawBase64 && rawBase64.trim().length > 0) {
    try {
      const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
      const credentials = parseServiceAccountCredentials(decoded);
      if (credentials) {
        return credentials;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function createCacheKey(text: string, targetLanguage: TtsTargetLanguage): string {
  return `${targetLanguage}:${text.toLowerCase()}`;
}

function pruneExpiredCacheEntries(now = Date.now()): void {
  for (const [key, entry] of pronunciationCache.entries()) {
    if (entry.expiresAt <= now) {
      pronunciationCache.delete(key);
    }
  }
}

function getCachedPronunciation(cacheKey: string): Buffer | null {
  const entry = pronunciationCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    pronunciationCache.delete(cacheKey);
    return null;
  }

  return Buffer.from(entry.audio);
}

function setCachedPronunciation(cacheKey: string, audio: Buffer): void {
  const now = Date.now();
  pruneExpiredCacheEntries(now);

  if (pronunciationCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = pronunciationCache.keys().next().value;
    if (typeof firstKey === "string") {
      pronunciationCache.delete(firstKey);
    }
  }

  pronunciationCache.set(cacheKey, {
    audio: Buffer.from(audio),
    expiresAt: now + PRONUNCIATION_CACHE_TTL_MS,
  });
}

export function clearPronunciationCache(): void {
  pronunciationCache.clear();
}

function createGoogleAuth(): GoogleAuth {
  const credentials = resolveServiceAccountCredentialsFromEnv();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? credentials?.project_id;

  const options: ConstructorParameters<typeof GoogleAuth>[0] = {
    scopes: [DEFAULT_GOOGLE_SCOPE],
  };

  if (credentials) {
    options.credentials = credentials;
  }

  if (projectId) {
    options.projectId = projectId;
  }

  return new GoogleAuth(options);
}

async function fetchAccessToken(auth = createGoogleAuth()): Promise<string> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  if (!token) {
    throw new Error("Unable to obtain Google Cloud access token");
  }

  return token;
}

async function synthesizeWithVoice(
  text: string,
  targetLanguage: TtsTargetLanguage,
  voiceName: string,
  accessToken: string,
  fetchImpl: FetchLike,
  quotaProjectId?: string,
): Promise<GoogleSynthesisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(GOOGLE_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(quotaProjectId ? { "x-goog-user-project": quotaProjectId } : {}),
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: TTS_LANGUAGE_CODES[targetLanguage],
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.95,
        },
      }),
      signal: controller.signal,
    });

    const responseJson = (await response.json()) as {
      audioContent?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      const message = responseJson.error?.message ?? "Google TTS request failed";
      return {
        ok: false,
        status: response.status,
        error: message,
      };
    }

    if (!responseJson.audioContent) {
      return {
        ok: false,
        status: 502,
        error: "Google TTS returned empty audio content",
      };
    }

    return {
      ok: true,
      body: Buffer.from(responseJson.audioContent, "base64"),
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Failed to connect to Google Text-to-Speech",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function synthesizeWithFallbackVoices(
  text: string,
  targetLanguage: TtsTargetLanguage,
  dependencies: PronunciationDependencies,
): Promise<GoogleSynthesisResult> {
  const getAccessToken = dependencies.getAccessToken ?? fetchAccessToken;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const accessToken = await getAccessToken();
  const quotaProjectId = resolveQuotaProjectId(resolveServiceAccountCredentialsFromEnv());
  const fallbackVoices = FALLBACK_VOICES[targetLanguage];

  let lastFailure: GoogleSynthesisResult | null = null;

  for (const voiceName of fallbackVoices) {
    const result = await synthesizeWithVoice(
      text,
      targetLanguage,
      voiceName,
      accessToken,
      fetchImpl,
      quotaProjectId,
    );
    if (result.ok) {
      return result;
    }

    lastFailure = result;
    const failedMessage = result.error?.toLowerCase() ?? "";
    const shouldTryNextVoice =
      result.status === 400 &&
      (failedMessage.includes("voice") || failedMessage.includes("not found"));

    if (!shouldTryNextVoice) {
      break;
    }
  }

  return (
    lastFailure ?? {
      ok: false,
      status: 500,
      error: "Unable to synthesize pronunciation audio",
    }
  );
}

export async function fetchPronunciationAudio(
  payload: PronunciationPayload,
  dependencies: PronunciationDependencies = {},
): Promise<PronunciationResult> {
  const validated = validatePayload(payload);
  if (validated.error) {
    return {
      status: 400,
      headers: {},
      json: { error: validated.error },
    };
  }

  if (!validated.text || !validated.targetLanguage) {
    return {
      status: 400,
      headers: {},
      json: { error: "Invalid pronunciation payload" },
    };
  }

  const cacheKey = createCacheKey(validated.text, validated.targetLanguage);
  const cachedAudio = getCachedPronunciation(cacheKey);
  if (cachedAudio) {
    return {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": PRONUNCIATION_CACHE_CONTROL,
      },
      body: cachedAudio,
    };
  }

  try {
    const result = await synthesizeWithFallbackVoices(
      validated.text,
      validated.targetLanguage,
      dependencies,
    );

    if (!result.ok || !result.body) {
      return {
        status: result.status ?? 502,
        headers: {},
        json: {
          error: result.error ?? "Unable to generate pronunciation audio",
        },
      };
    }

    setCachedPronunciation(cacheKey, result.body);

    return {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": PRONUNCIATION_CACHE_CONTROL,
      },
      body: result.body,
    };
  } catch {
    return {
      status: 500,
      headers: {},
      json: { error: "Failed to generate pronunciation audio" },
    };
  }
}
