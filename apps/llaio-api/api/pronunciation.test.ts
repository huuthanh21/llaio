import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createPronunciationHandler,
} from "./pronunciation";
import type {
  PronunciationPayload,
  PronunciationResult,
} from "../src/pronunciation.js";

const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

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
  if (originalAllowedOrigins === undefined) {
    delete process.env.ALLOWED_ORIGINS;
    return;
  }

  process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
});

describe("api/pronunciation handler", () => {
  it("returns 403 for disallowed origin", async () => {
    const handler = createPronunciationHandler(async () => {
      return { status: 200, headers: {}, body: Buffer.from([1]) };
    });
    const req = {
      method: "POST",
      headers: { origin: "https://blocked.example" },
      body: { text: "hello", targetLanguage: "English" },
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(403);
    expect(res.getJson()).toEqual({ error: "Origin is not allowed" });
  });

  it("handles preflight request", async () => {
    const handler = createPronunciationHandler(async () => {
      return { status: 200, headers: {}, body: Buffer.from([1]) };
    });
    const req = {
      method: "OPTIONS",
      headers: { origin: "https://allowed.example" },
      body: {},
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(204);
    expect(res.hasEnded()).toBe(true);
    expect(res.getHeader("access-control-allow-origin")).toBe("https://allowed.example");
    expect(res.getHeader("access-control-allow-methods")).toBe("POST,OPTIONS");
  });

  it("rejects unsupported methods", async () => {
    const handler = createPronunciationHandler(async () => {
      return { status: 200, headers: {}, body: Buffer.from([1]) };
    });
    const req = {
      method: "GET",
      headers: { origin: "https://allowed.example" },
      body: {},
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(405);
    expect(res.getJson()).toEqual({ error: "Method not allowed" });
  });

  it("passes body payload to pronunciation service", async () => {
    const seenPayloads: PronunciationPayload[] = [];
    const handler = createPronunciationHandler(async (payload) => {
      seenPayloads.push(payload);
      return {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
        body: Buffer.from([9, 8, 7]),
      };
    });

    const req = {
      method: "POST",
      headers: { origin: "https://allowed.example" },
      body: { text: "ciao", targetLanguage: "Italian" },
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(seenPayloads).toEqual([{ text: "ciao", targetLanguage: "Italian" }]);
    expect(res.getStatus()).toBe(200);
    expect(res.getHeader("content-type")).toBe("audio/mpeg");
    expect(Array.from(res.getSentBody() as Buffer)).toEqual([9, 8, 7]);
  });

  it("returns json error when pronunciation service fails", async () => {
    const handler = createPronunciationHandler(async (): Promise<PronunciationResult> => {
      return {
        status: 429,
        headers: {},
        json: { error: "Quota exceeded" },
      };
    });

    const req = {
      method: "POST",
      headers: { origin: "https://allowed.example" },
      body: { text: "bonjour", targetLanguage: "French" },
    } as unknown as VercelRequest;
    const res = createResponseMock();

    await handler(req, res.response);

    expect(res.getStatus()).toBe(429);
    expect(res.getJson()).toEqual({ error: "Quota exceeded" });
  });
});
