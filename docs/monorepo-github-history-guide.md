# Merge `llaio` + `llaio-api` with history

This guide keeps commit history from both existing GitHub repos.

## Goal

- Keep current `llaio` history in repo root
- Move frontend into `apps/llaio`
- Import `llaio-api` history into `apps/llaio-api`

## Recommended clean flow

Run these commands in a fresh branch of `huuthanh21/llaio`:

```bash
git checkout -b chore/monorepo-migration

# 1) Move existing frontend to apps/llaio
mkdir -p apps
git mv .editorconfig .gitignore .prettierrc .vscode AGENTS.md GENANKI.md LICENSE README.md bunfig.toml components.json eslint.config.js index.html package.json playwright.config.ts postcss.config.js public src tailwind.config.ts tests tsconfig.app.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts apps/llaio
git commit -m "chore(monorepo): move frontend to apps/llaio"

# 2) Add monorepo root files
# (create root package.json, root .gitignore, root README.md)
git add package.json .gitignore README.md
git commit -m "chore(monorepo): add workspace root configuration"

# 3) Import llaio-api with full history
git remote add llaio-api git@github.com:huuthanh21/llaio-api.git
git fetch llaio-api
git subtree add --prefix=apps/llaio-api llaio-api main

# 4) Apply API/frontend integration changes
# (env vars, proxy path, CORS allowlist, Vercel function route)
git add .
git commit -m "feat(api): configure proxy-image endpoint and env-based CORS"

# 5) Push and open PR
git push -u origin chore/monorepo-migration
```

## Why `git subtree`

- It preserves full history from `llaio-api`
- It keeps files under `apps/llaio-api`
- GitHub shows cross-repo history correctly per file path

## Vercel setup after merge

Create two Vercel projects from the same repository:

1. Frontend project
   - Root Directory: `apps/llaio`
   - Env: `VITE_PROXY_API_BASE_URL=https://<api-project>.vercel.app`

2. API project
   - Root Directory: `apps/llaio-api`
   - Env: `ALLOWED_ORIGINS=https://<frontend-project>.vercel.app,http://localhost:5173`

## If you already copied `llaio-api` files manually

If `apps/llaio-api` was copied without subtree history, use this fix:

```bash
git rm -r apps/llaio-api
git commit -m "chore: remove copied api folder before subtree import"

git remote add llaio-api git@github.com:huuthanh21/llaio-api.git
git fetch llaio-api
git subtree add --prefix=apps/llaio-api llaio-api main
```

Then re-apply any monorepo-specific API edits and commit.
