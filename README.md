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

## Releases

- This repo uses Release Please and Conventional Commits.
- Do not use Changesets (`bunx changeset`) in this repository.
- Release automation runs on pushes to `master` and opens release PRs automatically.
- If GitHub blocks PR creation for `GITHUB_TOKEN`, add a repo secret `RELEASE_PLEASE_TOKEN` (classic PAT with `repo` scope or fine-grained token with contents + pull requests write).
- Package version sources:
  - Frontend app (`apps/llaio`) -> `apps/llaio/package.json`
  - API service (`apps/llaio-api`) -> `apps/llaio-api/package.json`
