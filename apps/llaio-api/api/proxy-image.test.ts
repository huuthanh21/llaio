import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./proxy-image";

const originalFetch = globalThis.fetch;
const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

function setFetchMock(impl: Parameters<typeof mock>[0]) {
  globalThis.fetch = mock(impl) as unknown as typeof fetch;
}

function createResponseMock() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let jsonBody: unknown;
  let sentBody: unknown;
  let ended = false;

  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
    send(payload: unknown) {
      sentBody = payload;
      return this;
    },
    end() {
      ended = true;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
      return this;
    },
  } as unknown as VercelResponse;

  return {
    response,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    getSentBody: () => sentBody,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    hasEnded: () => ended,
  };
}

beforeEach(() => {
  process.env.ALLOWED_ORIGINS = "https://allowed.example";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalAllowedOrigins === undefined) {
    delete process.env.ALLOWED_ORIGINS;
  } else {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

describe("api/proxy-image handler", () => {
  it("returns 403 for disallowed origin", async () => {
    const req = {
      method: "GET",
      headers: { origin: "https://blocked.example" },
      query: { url: "https://example.com/image.png" },
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(403);
    expect(res.getJson()).toEqual({ error: "Origin is not allowed" });
  });

  it("handles preflight request", async () => {
    const req = {
      method: "OPTIONS",
      headers: { origin: "https://allowed.example" },
      query: {},
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(204);
    expect(res.hasEnded()).toBe(true);
    expect(res.getHeader("access-control-allow-origin")).toBe("https://allowed.example");
  });

  it("rejects unsupported methods", async () => {
    const req = {
      method: "POST",
      headers: { origin: "https://allowed.example" },
      query: {},
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(405);
    expect(res.getJson()).toEqual({ error: "Method not allowed" });
  });

  it("returns proxied image bytes on success", async () => {
    const payload = new Uint8Array([9, 8, 7]);
    setFetchMock(async () => {
      return new Response(payload, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });
    });

    const req = {
      method: "GET",
      headers: { origin: "https://allowed.example" },
      query: { url: "https://cdn.example.com/image.jpg" },
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(200);
    expect(res.getHeader("content-type")).toBe("image/jpeg");
    expect(res.getHeader("cache-control")).toBe("public, max-age=3600");
    expect(Array.from(res.getSentBody() as Buffer)).toEqual([9, 8, 7]);
  });
});
