import { describe, expect, it } from "bun:test";
import {
  clearPronunciationCache,
  fetchPronunciationAudio,
  resolveServiceAccountCredentialsFromEnv,
} from "./pronunciation";

function createSuccessResponse(bytes: number[]): Response {
  const audioContent = Buffer.from(bytes).toString("base64");
  return new Response(JSON.stringify({ audioContent }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("fetchPronunciationAudio", () => {
  it("sends x-goog-user-project header when quota project env is set", async () => {
    clearPronunciationCache();
    const originalQuotaProject = process.env.GOOGLE_CLOUD_QUOTA_PROJECT;
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT = "astral-net-236306";

    let seenQuotaHeader = "";
    const result = await fetchPronunciationAudio(
      {
        text: "serendipity",
        targetLanguage: "English",
      },
      {
        getAccessToken: async () => "test-token",
        fetchImpl: async (_input, init) => {
          const headers = init?.headers as Record<string, string>;
          seenQuotaHeader = headers["x-goog-user-project"] ?? "";
          return createSuccessResponse([1, 1, 1]);
        },
      },
    );

    if (originalQuotaProject === undefined) {
      delete process.env.GOOGLE_CLOUD_QUOTA_PROJECT;
    } else {
      process.env.GOOGLE_CLOUD_QUOTA_PROJECT = originalQuotaProject;
    }

    expect(result.status).toBe(200);
    expect(seenQuotaHeader).toBe("astral-net-236306");
  });

  it("parses service-account JSON from base64 env", () => {
    const originalInline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const originalBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64;

    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64 = Buffer.from(
      JSON.stringify({
        type: "service_account",
        project_id: "astral-net-236306",
        private_key: "line1\\nline2",
        client_email: "tts-test@astral-net-236306.iam.gserviceaccount.com",
      }),
      "utf8",
    ).toString("base64");

    const credentials = resolveServiceAccountCredentialsFromEnv();

    if (originalInline === undefined) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    } else {
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = originalInline;
    }

    if (originalBase64 === undefined) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64;
    } else {
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64 = originalBase64;
    }

    expect(credentials).toBeTruthy();
    expect(credentials?.client_email).toBe("tts-test@astral-net-236306.iam.gserviceaccount.com");
    expect(credentials?.private_key).toBe("line1\nline2");
  });

  it("uses service-account JSON from environment when provided", async () => {
    clearPronunciationCache();
    const originalInline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const originalProject = process.env.GOOGLE_CLOUD_PROJECT;

    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      type: "service_account",
      project_id: "astral-net-236306",
      private_key_id: "test-key-id",
      private_key: "-----BEGIN PRIVATE KEY-----\\nFAKE\\n-----END PRIVATE KEY-----\\n",
      client_email: "tts-test@astral-net-236306.iam.gserviceaccount.com",
      client_id: "123",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/test",
    });
    process.env.GOOGLE_CLOUD_PROJECT = "astral-net-236306";

    let callCount = 0;
    const result = await fetchPronunciationAudio(
      {
        text: "serendipity",
        targetLanguage: "English",
      },
      {
        getAccessToken: async () => "env-service-account-token",
        fetchImpl: async () => {
          callCount += 1;
          return createSuccessResponse([1, 3, 3, 7]);
        },
      },
    );

    if (originalInline === undefined) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    } else {
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = originalInline;
    }

    if (originalProject === undefined) {
      delete process.env.GOOGLE_CLOUD_PROJECT;
    } else {
      process.env.GOOGLE_CLOUD_PROJECT = originalProject;
    }

    expect(callCount).toBe(1);
    expect(result.status).toBe(200);
    expect(Array.from(result.body ?? Buffer.alloc(0))).toEqual([1, 3, 3, 7]);
  });

  it("reuses cached pronunciation for repeated requests", async () => {
    clearPronunciationCache();
    let callCount = 0;

    const dependencies = {
      getAccessToken: async () => "test-token",
      fetchImpl: async () => {
        callCount += 1;
        return createSuccessResponse([7, 7, 7]);
      },
    };

    const first = await fetchPronunciationAudio(
      {
        text: "Serendipity",
        targetLanguage: "English",
      },
      dependencies,
    );

    const second = await fetchPronunciationAudio(
      {
        text: "serendipity",
        targetLanguage: "English",
      },
      dependencies,
    );

    expect(callCount).toBe(1);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(Array.from(first.body ?? Buffer.alloc(0))).toEqual([7, 7, 7]);
    expect(Array.from(second.body ?? Buffer.alloc(0))).toEqual([7, 7, 7]);
  });

  it("returns 400 when text is missing", async () => {
    clearPronunciationCache();
    const result = await fetchPronunciationAudio({ text: "", targetLanguage: "English" });

    expect(result.status).toBe(400);
    expect(result.json).toEqual({ error: "Missing text" });
  });

  it("returns 400 when target language is unsupported", async () => {
    clearPronunciationCache();
    const result = await fetchPronunciationAudio({
      text: "hola",
      targetLanguage: "Korean",
    });

    expect(result.status).toBe(400);
    expect(result.json).toEqual({ error: "Unsupported targetLanguage" });
  });

  it("returns 400 when text exceeds 5000-byte limit", async () => {
    clearPronunciationCache();
    const oversizedText = "a".repeat(5001);
    const result = await fetchPronunciationAudio({
      text: oversizedText,
      targetLanguage: "English",
    });

    expect(result.status).toBe(400);
    expect(result.json).toEqual({ error: "Text exceeds 5000-byte limit" });
  });

  it("returns audio bytes and cache headers on success", async () => {
    clearPronunciationCache();
    let callCount = 0;
    const result = await fetchPronunciationAudio(
      {
        text: "serendipity",
        targetLanguage: "English",
      },
      {
        getAccessToken: async () => "test-token",
        fetchImpl: async () => {
          callCount += 1;
          return createSuccessResponse([1, 2, 3, 4]);
        },
      },
    );

    expect(callCount).toBe(1);
    expect(result.status).toBe(200);
    expect(result.headers["Content-Type"]).toBe("audio/mpeg");
    expect(result.headers["Cache-Control"]).toBe("public, max-age=172800");
    expect(Array.from(result.body ?? Buffer.alloc(0))).toEqual([1, 2, 3, 4]);
  });

  it("falls back to next voice when first voice is unavailable", async () => {
    clearPronunciationCache();
    let callCount = 0;
    const result = await fetchPronunciationAudio(
      {
        text: "xin chao",
        targetLanguage: "Vietnamese",
      },
      {
        getAccessToken: async () => "test-token",
        fetchImpl: async () => {
          callCount += 1;
          if (callCount === 1) {
            return new Response(
              JSON.stringify({
                error: { message: "Requested voice was not found" },
              }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            );
          }

          return createSuccessResponse([9, 8, 7]);
        },
      },
    );

    expect(callCount).toBe(2);
    expect(result.status).toBe(200);
    expect(Array.from(result.body ?? Buffer.alloc(0))).toEqual([9, 8, 7]);
  });

  it("returns upstream error without trying remaining voices for non-voice failures", async () => {
    clearPronunciationCache();
    let callCount = 0;
    const result = await fetchPronunciationAudio(
      {
        text: "bonjour",
        targetLanguage: "French",
      },
      {
        getAccessToken: async () => "test-token",
        fetchImpl: async () => {
          callCount += 1;
          return new Response(
            JSON.stringify({
              error: { message: "Quota exceeded" },
            }),
            {
              status: 429,
              headers: { "content-type": "application/json" },
            },
          );
        },
      },
    );

    expect(callCount).toBe(1);
    expect(result.status).toBe(429);
    expect(result.json).toEqual({ error: "Quota exceeded" });
  });

  it("returns 500 when token retrieval fails", async () => {
    clearPronunciationCache();
    const result = await fetchPronunciationAudio(
      {
        text: "hallo",
        targetLanguage: "German",
      },
      {
        getAccessToken: async () => {
          throw new Error("no credentials");
        },
      },
    );

    expect(result.status).toBe(500);
    expect(result.json).toEqual({ error: "Failed to generate pronunciation audio" });
  });
});
