# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Documentation status

Only the root `README.md` is current (setup + deployment; no architecture).

**Do not trust these files** — they describe a pre-backend prototype that no longer exists
(mock data, `/create` and `/module/[id]` as stubs, auth/DB/API listed as "future plans"):

- `frontend/PROJECT_OVERVIEW.md`
- `frontend/COMPONENTS.md`
- `frontend/QUICK_START.md`
- `backend/README.md` — untouched NestJS boilerplate, zero project-specific content

None of them mention `dictionary-service/`, the dual-storage auth model, or the
server/client API base-URL split. Read the code, or this file.

## Repository shape

Three independent npm projects plus Postgres. **There are no npm workspaces** — the root
`package.json` only orchestrates test runs via `npm --prefix`. Each project has its own
`package-lock.json` and needs its own `npm install`.

| Project | Stack | Port | Talks to |
| --- | --- | --- | --- |
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind 4 + DaisyUI 5 | 3000 | backend |
| `backend/` | NestJS 11, Prisma 6, JWT/Passport | 3001 | Postgres, dictionary-service |
| `dictionary-service/` | NestJS 11 + cheerio; stateless, no DB, no auth | 4000 | Cambridge / Oxford (scraped HTML) |

`backend/` is the only service that touches Postgres. `dictionary-service/` is
internal-only and exposes just `GET /health` and `GET /internal/lookup?word=&source=`.

## Commands

### Root

```bash
npm test           # backend → dictionary-service → frontend, sequential
npm run test:e2e   # frontend Playwright suite
```

### Backend and dictionary-service (Jest, `.spec.ts` colocated under `src/`)

```bash
npm --prefix backend run start:dev
npm --prefix backend run build
npm --prefix backend run lint            # eslint --fix
npm --prefix backend run test:cov
npm --prefix backend run test:e2e        # separate config: test/jest-e2e.json

npm --prefix backend test -- flashcards.service   # single file (path regex)
npm --prefix backend test -- -t "test name"       # single test
```

### Frontend (Vitest + jsdom for unit, Playwright for e2e)

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run test:watch

npm --prefix frontend test -- lib/api.spec.ts     # single file
npm --prefix frontend test -- -t "test name"      # single test

cd frontend && npx playwright test e2e/login.spec.ts --project=chromium
```

`playwright.config.ts` starts the dev server itself and runs chromium/firefox/webkit.

### Prisma

```bash
cd backend
npx prisma generate                    # required after ANY schema.prisma edit
npx prisma migrate dev --name <name>   # local
npx prisma migrate deploy              # CI / production
```

### Docker (two things the README obscures)

- `docker compose up -d` starts the **whole** dev stack — postgres, backend,
  dictionary-service, frontend, pgadmin — not just Postgres as the README's step 2 implies.
- The `backend` service declares `env_file: ./backend/.env`. Compose fails outright if that
  file does not exist.

## Architecture

### Auth — the token is stored twice

This is the single most confusing part of the codebase.

- The backend issues a JWT with a **60-minute** expiry (`backend/src/auth/auth.module.ts`).
- The frontend persists it in **two** places:
  - `localStorage.token` / `localStorage.user` — used by client-side fetches.
  - a **non-httpOnly `token` cookie** with `max-age=3600` — the only way Server Components
    can see it, via `getServerAuthToken()` in `frontend/lib/server-auth.ts`.
- `persistAuthSession()` and `clearAuthSession()` in `frontend/lib/auth.ts` are the only
  functions that should ever write both. `syncAuthCookieFromStorage()` reconciles them, and
  `AuthSessionSync` (mounted in the root layout) calls `router.refresh()` when they diverge.
- Server Components read the cookie and pass `{ token }` **explicitly** into `lib/api.ts`
  calls. Client callers omit it and fall back to localStorage inside `resolveAuthToken()`.

**Known-broken territory:** the cookie `max-age` and the JWT `exp` drift independently, so
sessions can go stale. A fix (`2e66121`, which introduced `frontend/lib/auth-token.ts`) was
reverted wholesale in `c1f22d8`. Read `git show 2e66121` before re-attempting this.

Google OAuth is **hand-rolled** in `backend/src/auth/auth.controller.ts` — there is no
passport-google strategy. `/auth/google` builds the consent URL by hand;
`/auth/google/callback` exchanges the code and redirects to the frontend `/auth/callback`
with `access_token`, `id`, `username`, and `email` **in the query string**.

### API base-URL duality

`frontend/lib/api.ts` picks its base URL per environment:

- `INTERNAL_API_URL` when `typeof window === "undefined"` (Server Components → `http://backend:3001`)
- `NEXT_PUBLIC_API_URL` in the browser

`NEXT_PUBLIC_API_URL` is baked in at Docker **build** time, so changing it requires an image
rebuild — CD refuses to publish the frontend unless it equals `https://$API_HOST`.

### Dictionary lookup path

Spans all three services:

1. `lookupDictionary()` (`frontend/lib/api.ts`) attaches the `source` preference read from
   localStorage (`cambridge` | `oxford`).
2. Backend `GET /dictionary/lookup` — JWT-guarded.
3. `DictionaryService.lookup()` (`backend/src/dictionary/dictionary.service.ts`) checks the
   `DictionaryEntry` cache, unique on `(normalizedWord, dictionarySource)`, TTL from
   `DICTIONARY_CACHE_TTL_DAYS` (default 30).
4. On a miss it calls dictionary-service `GET /internal/lookup`, which scrapes Cambridge or
   Oxford with cheerio.
5. Upstream audio URLs are rewritten into `DictionaryAudio` rows keyed by
   `sha256(sourceUrl).slice(0, 24)` and returned to the client as `/dictionary/audio/:id`.

`GET /dictionary/audio/:id` is deliberately **not** JWT-guarded — an `<audio>` element
cannot send an `Authorization` header. It proxies the upstream file through the backend.

### Module authorization

`moduleAccessWhere()` in `backend/src/flashcards/flashcards.service.ts` scopes every read
and write to:

```
userId = user.userId  OR  (userId IS NULL AND author = user.username)
```

The second branch is a legacy path for modules created before `Module.userId` existed. A
missing *or* foreign module throws **404, never 403**.

`update()` deletes and recreates **all** terms inside a transaction — term IDs are not
stable across saves. Term order lives in `Term.position`.

### Silent-failure convention

`getModules()` and `getModule()` return `[]` / `null` on a missing token or a 401/403
instead of throwing, so the UI renders empty states rather than error states. Check this
before debugging "why is my list empty".

## Conventions

- **All user-facing UI text is Russian.** Keep new strings Russian. Code comments are mixed
  Russian/English.
- **Theming:** four DaisyUI themes defined in `frontend/app/globals.css` — `dark-classic`
  (default), `light-classic`, `light`, `dark` — applied as `data-theme` on `<html>` by
  `ThemeSync`. Components combine DaisyUI classes with ~25 CSS custom properties
  (`--app-panel`, `--app-border`, `--app-text-strong`, `--app-focus`, `--app-field-*`, …).
  Follow that pattern; do not introduce raw hex values.
- **Frontend tests** are `.spec.tsx` colocated beside the component under test.
  `frontend/test/setup.ts` clears localStorage, sessionStorage, the token cookie, and the
  theme attribute after every test.
- **Backend/dictionary tests** are `.spec.ts` colocated under `src/` (`rootDir: src`).

## Known gaps

- `POST /upload` (`backend/src/uploads/uploads.controller.ts`) has **no auth guard** and no
  file-type or size validation. Files land in `backend/uploads/`, served statically at
  `/uploads` via `ServeStaticModule`.
- `frontend/lib/mockData.ts` is **dead code** — referenced only by its own spec file, by no
  page or component.
- Study modes (карточки / заучивание / тест) are not implemented.

## CI/CD

`.github/workflows/ci.yml` runs on every push:

1. Matrix job — backend / dictionary-service / frontend, each install → build → test
   (backend also runs `prisma generate` and validates that Prisma survives `--omit=dev`).
2. `frontend-e2e` — Playwright, uploads the HTML report as an artifact.
3. `production-config` — renders `deploy/nginx/default.conf.template` and asserts that
   **only** nginx publishes ports 80 and 443.

`.github/workflows/cd.yml` fires on successful CI on `main`/`master` and pushes three images
to GHCR tagged `sha-<sha>`. Two GitHub Actions **repository variables** are required:
`API_HOST` (bare DNS name) and `NEXT_PUBLIC_API_URL` (must equal `https://$API_HOST`).

Deploy with `./scripts/deploy-production.sh .env.production`; first-time TLS bootstrap with
`./scripts/init-production-tls.sh .env.production`. Rollback = set `IMAGE_TAG` back to an
earlier `sha-*` and re-run the deploy script.
