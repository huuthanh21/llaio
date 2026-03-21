import { afterEach, describe, expect, it } from "bun:test";
import { getAllowedOrigins, isAllowedOrigin } from "./config";

const ORIGINAL_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

afterEach(() => {
  if (ORIGINAL_ALLOWED_ORIGINS === undefined) {
    delete process.env.ALLOWED_ORIGINS;
    return;
  }

  process.env.ALLOWED_ORIGINS = ORIGINAL_ALLOWED_ORIGINS;
});

describe("getAllowedOrigins", () => {
  it("returns defaults when env is not set", () => {
    delete process.env.ALLOWED_ORIGINS;

    expect(getAllowedOrigins()).toEqual([
      "http://localhost:5173",
      "https://llaio.vercel.app",
    ]);
  });

  it("parses comma-separated env values and trims whitespace", () => {
    process.env.ALLOWED_ORIGINS = " https://example.com , http://localhost:3000 ,, ";

    expect(getAllowedOrigins()).toEqual([
      "https://example.com",
      "http://localhost:3000",
    ]);
  });
});

describe("isAllowedOrigin", () => {
  const allowedOrigins = ["https://example.com", "http://localhost:5173"];

  it("allows missing origin", () => {
    expect(isAllowedOrigin(undefined, allowedOrigins)).toBe(true);
  });

  it("allows a configured origin", () => {
    expect(isAllowedOrigin("https://example.com", allowedOrigins)).toBe(true);
  });

  it("rejects an unconfigured origin", () => {
    expect(isAllowedOrigin("https://evil.com", allowedOrigins)).toBe(false);
  });
});
