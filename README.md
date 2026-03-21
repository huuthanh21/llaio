# llaio monorepo

This repository contains both the frontend app and API service.

## Apps

- `apps/llaio`: React + Vite frontend
- `apps/llaio-api`: CORS proxy API for image downloads

## Development

- Frontend: `bun run dev:frontend`
- API: `bun run dev:api`

## Environment Variables

- Frontend (`apps/llaio/.env`):
  - `VITE_PROXY_API_BASE_URL`
- API (`apps/llaio-api/.env`):
  - `PORT`
  - `ALLOWED_ORIGINS`
