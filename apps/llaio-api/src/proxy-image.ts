const REQUEST_TIMEOUT_MS = 15000;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export interface ProxyImageResult {
  status: number;
  headers: Record<string, string>;
  body?: Buffer;
  json?: Record<string, string>;
}

export async function fetchProxiedImage(url: string): Promise<ProxyImageResult> {
  if (!url) {
    return { status: 400, headers: {}, json: { error: "Missing url parameter" } };
  }

  if (!isHttpUrl(url)) {
    return { status: 400, headers: {}, json: { error: "Invalid url parameter" } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        status: response.status,
        headers: {},
        json: { error: `Failed to fetch: ${response.statusText}` },
      };
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await response.arrayBuffer());

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
