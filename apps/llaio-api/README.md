# llaio-api

API service for `llaio` image proxying and pronunciation synthesis.

## Endpoints

- `GET /`: health check for local development server
- `GET /api/proxy-image?url=<encoded-url>`: fetches and returns remote image bytes
- `POST /api/pronunciation`: synthesizes pronunciation audio for a word using Google Cloud Text-to-Speech

## Local Development

```bash
bun run dev
```

Default port is `3000`.

## Environment Variables

- `PORT`: local server port (default `3000`)
- `ALLOWED_ORIGINS`: comma-separated CORS allowlist
- `GOOGLE_APPLICATION_CREDENTIALS`: optional path to local service-account JSON for ADC
- `GOOGLE_CLOUD_PROJECT`: optional override for Google Cloud project id
- `GOOGLE_CLOUD_QUOTA_PROJECT`: optional quota/billing project id for `x-goog-user-project`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: optional raw service-account JSON string for serverless environments
- `GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64`: optional base64-encoded service-account JSON (safer copy/paste for env vars)

## Vercel

The deployed endpoints are implemented at `api/proxy-image.ts` and `api/pronunciation.ts`.

### Vercel Production Setup (Google TTS)

For Vercel, prefer service-account JSON via env var over file paths:

1. Create a Google Cloud service account with Text-to-Speech usage permissions.
2. Add these **Production** env vars in Vercel project settings:
   - `GOOGLE_CLOUD_PROJECT`
   - `GOOGLE_CLOUD_QUOTA_PROJECT`
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64` (base64 of the full service-account JSON)
3. Redeploy production so the function picks up the new env vars.

CLI example:

```bash
cat service-account.json | base64 -w0 > sa.b64
vercel env add GOOGLE_CLOUD_PROJECT production
vercel env add GOOGLE_CLOUD_QUOTA_PROJECT production
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64 production < sa.b64
```
