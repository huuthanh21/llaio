import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllowedOrigins, isAllowedOrigin } from "../src/config";
import { fetchProxiedImage } from "../src/proxy-image";

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
