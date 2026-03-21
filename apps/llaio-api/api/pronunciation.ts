import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  fetchPronunciationAudio,
  type PronunciationPayload,
  type PronunciationResult,
} from "../src/pronunciation.js";

type PronunciationFetcher = (payload: PronunciationPayload) => Promise<PronunciationResult>;

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,https://llaio.vercel.app";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function isAllowedOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function setCorsHeaders(request: VercelRequest, response: VercelResponse): boolean {
  const origin = request.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    response.status(403).json({ error: "Origin is not allowed" });
    return false;
  }

  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return true;
}

function parseBody(request: VercelRequest): { text: string; targetLanguage: string } {
  if (!request.body || typeof request.body !== "object") {
    return { text: "", targetLanguage: "" };
  }

  const body = request.body as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text : "";
  const targetLanguage = typeof body.targetLanguage === "string" ? body.targetLanguage : "";

  return { text, targetLanguage };
}

export function createPronunciationHandler(fetchPronunciation: PronunciationFetcher = fetchPronunciationAudio) {
  return async function handler(request: VercelRequest, response: VercelResponse) {
    if (!setCorsHeaders(request, response)) {
      return;
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const payload = parseBody(request);
    const result = await fetchPronunciation(payload);

    for (const [name, value] of Object.entries(result.headers)) {
      response.setHeader(name, value);
    }

    if (result.body) {
      response.status(result.status).send(result.body);
      return;
    }

    response.status(result.status).json(result.json ?? { error: "Unknown pronunciation error" });
  };
}

export default createPronunciationHandler();
