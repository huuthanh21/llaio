import { afterEach, describe, expect, it, mock } from "bun:test";
import { fetchProxiedImage } from "./proxy-image";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function setFetchMock(impl: Parameters<typeof mock>[0]) {
  globalThis.fetch = mock(impl) as unknown as typeof fetch;
}

describe("fetchProxiedImage", () => {
  it("returns 400 when url is missing", async () => {
    const result = await fetchProxiedImage("");

    expect(result.status).toBe(400);
    expect(result.json).toEqual({ error: "Missing url parameter" });
  });

  it("returns 400 when url is not http(s)", async () => {
    const result = await fetchProxiedImage("ftp://example.com/file.png");

    expect(result.status).toBe(400);
    expect(result.json).toEqual({ error: "Invalid url parameter" });
  });

  it("returns upstream non-2xx status and error message", async () => {
    setFetchMock(async () => {
      return new Response("nope", { status: 404, statusText: "Not Found" });
    });

    const result = await fetchProxiedImage("https://example.com/missing.png");

    expect(result.status).toBe(404);
    expect(result.json).toEqual({ error: "Failed to fetch: Not Found" });
  });

  it("returns bytes and cache headers on success", async () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    setFetchMock(async () => {
      return new Response(payload, {
        status: 200,
        headers: {
          "content-type": "image/png",
        },
      });
    });

    const result = await fetchProxiedImage("https://example.com/image.png");

    expect(result.status).toBe(200);
    expect(result.headers["Content-Type"]).toBe("image/png");
    expect(result.headers["Cache-Control"]).toBe("public, max-age=3600");
    expect(result.body).toBeDefined();
    expect(Array.from(result.body ?? Buffer.alloc(0))).toEqual([1, 2, 3, 4]);
  });

  it("returns 500 when upstream fetch throws", async () => {
    setFetchMock(async () => {
      throw new Error("network down");
    });

    const result = await fetchProxiedImage("https://example.com/image.png");

    expect(result.status).toBe(500);
    expect(result.json).toEqual({ error: "Failed to fetch URL" });
  });
});
