# llaio-api

API service for `llaio` image proxying.

## Endpoints

- `GET /`: health check for local development server
- `GET /api/proxy-image?url=<encoded-url>`: fetches and returns remote image bytes

## Local Development

```bash
bun run dev
```

Default port is `3000`.

## Environment Variables

- `PORT`: local server port (default `3000`)
- `ALLOWED_ORIGINS`: comma-separated CORS allowlist

## Vercel

The deployed endpoint is implemented at `api/proxy-image.ts`.
