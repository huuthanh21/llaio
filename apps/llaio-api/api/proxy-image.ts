import type { VercelRequest, VercelResponse } from "@vercel/node";

const REQUEST_TIMEOUT_MS = 15000;

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

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchProxiedImage(url: string) {
  if (!url) {
    return { status: 400, headers: {}, json: { error: "Missing url parameter" } };
  }

  if (!isHttpUrl(url)) {
    return { status: 400, headers: {}, json: { error: "Invalid url parameter" } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });

    if (!upstream.ok) {
      return {
        status: upstream.status,
        headers: {},
        json: { error: `Failed to fetch: ${upstream.statusText}` },
      };
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());

    return {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
      body,
    };
  } catch {
    return { status: 500, headers: {}, json: { error: "Failed to fetch URL" } };
  } finally {
    clearTimeout(timeout);
  }
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
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return true;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!setCorsHeaders(request, response)) {
    return;
  }

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const url = typeof request.query.url === "string" ? request.query.url : "";
  const result = await fetchProxiedImage(url);

  for (const [name, value] of Object.entries(result.headers)) {
    response.setHeader(name, value);
  }

  if (result.body) {
    response.status(result.status).send(result.body);
    return;
  }

  response.status(result.status).json(result.json ?? { error: "Unknown proxy error" });
}
