# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ThoughtFocus "Confluence Page" — the AI for Developers program hub. Vite + React 19 frontend backed by an Express 5 + better-sqlite3 API, versioned at `/api/v1`. Contract: [server/openapi.yaml](server/openapi.yaml).

## Commands

### Run
- `npm run dev` — API (port 3001) + Vite dev server together via `concurrently`. Vite proxies `/api` to `localhost:3001` ([vite.config.ts](vite.config.ts)).
- `npm run dev:server` — Express API only (`tsx watch server/src/index.ts`).
- `npm run dev:web` — Vite only.
- First boot auto-applies SQLite migrations and seeds demo data into `data/` (gitignored) if the `users` table is empty.

### Build / Lint
- `npm run build` — `tsc -b` (typechecks `src/` per [tsconfig.app.json](tsconfig.app.json); the root tsconfig only references the frontend project configs) then `vite build`. There is no compiled production entrypoint for `server/` — it only runs via `tsx`.
- `npm run lint` — oxlint ([.oxlintrc.json](.oxlintrc.json)), not ESLint.

### Database
- `npm run db:migrate` — apply pending SQL files from `server/migrations/`, tracked in a `schema_migrations` table.
- `npm run db:seed` — idempotent demo users/artifacts/files (see README for demo account credentials).

### Tests
Two independent Vitest configs — pick the right one:
- `npm test` / `npm run test:watch` — frontend, config in [vite.config.ts](vite.config.ts) (`test` block). Default environment is `node`; component tests that touch the DOM opt in per-file with a `/** @vitest-environment jsdom */` docblock (see any `*.test.tsx`).
- `npm run test:server` — API + SQLite, config in [server/vitest.config.ts](server/vitest.config.ts), scoped to `server/tests/**`.
- `npm run test:smoke` — just `server/tests/flow.test.ts` (login → create → upload → download → delete).
- `npm run test:all` — both suites.
- `npm run test:coverage` — frontend coverage.
- Single file: `npx vitest run <path>` (frontend) or `npx vitest run --config server/vitest.config.ts server/tests/<file>.test.ts` (server).

## Architecture

### Two independent TS projects in one repo
`src/` (frontend) and `server/` (backend) have separate `tsconfig.json`s and are never bundled together — the frontend never imports from `server/`. They share no code, so some models are hand-duplicated: `Role`/`Permission` and the role→permission map exist in both [server/src/permissions.ts](server/src/permissions.ts) and [src/auth/permissions.ts](src/auth/permissions.ts). Update both when changing roles or permissions.

Server-side TS imports use explicit `.ts` extensions (e.g. `from './app.ts'`) — required by the `verbatimModuleSyntax` / `allowImportingTsExtensions` tsconfig combo and how `tsx` resolves modules at runtime. Match this in new server files.

### Backend: routes → services → repositories
Every resource (`auth`, `users`, `artifacts`, files) follows the same layering, wired up in [server/src/app.ts](server/src/app.ts)'s `createApp()`:
- **repositories** (`server/src/repositories/*`) — raw `better-sqlite3` prepared statements, map snake_case columns to camelCase records.
- **services** (`server/src/services/*`) — business rules; throw `HttpError` subclasses from [server/src/errors.ts](server/src/errors.ts) (`unauthorized`, `forbidden`, `notFound`, `conflict`) rather than returning error values.
- **routes** (`server/src/routes/*`) — thin Express handlers, each wrapping its body in try/catch and calling `next(error)`. Auth is applied per-route via `createAuthMiddleware(auth)` + `requirePermission(permission)` from [server/src/middleware/auth.ts](server/src/middleware/auth.ts); `getActor(res)` reads the authenticated user back out of `res.locals`.

All factories are plain functions taking dependencies as arguments — no DI container (e.g. `createArtifactService(artifactRepo, fileRepo)`). Tests build an isolated app the same way production does, via `openMemoryDatabase()` + `migrate()` + `seedDatabase()` + `createApp()`; see the `createTestContext()` helper in [server/tests/helpers.ts](server/tests/helpers.ts) rather than re-deriving this wiring per test file.

Responses go through [server/src/http.ts](server/src/http.ts): `sendData()` for `{ data, meta?, links? }`, `sendError()` for `{ error: { code, message, details? } }`. The single `errorHandler` middleware (registered last in `createApp`) translates `HttpError`, `ZodError` (→ 422 with per-field `details`), multer file-size errors, and JSON parse errors into that envelope — route handlers should never format error responses by hand.

### Auth
JWT bearer tokens (`Authorization: Bearer <token>`), signed in [server/src/services/authService.ts](server/src/services/authService.ts) with a 12h TTL. Permission checks are role-based only (`can(role, permission)`), not per-resource ACLs — any `admin` can manage any artifact, not just their own.

Frontend mirrors this: [src/auth/AuthContext.tsx](src/auth/AuthContext.tsx) holds the session, backed by [src/auth/session.ts](src/auth/session.ts) which persists to `sessionStorage` (not `localStorage`). [src/auth/authService.ts](src/auth/authService.ts) (login/signup) calls `fetch()` directly instead of going through [src/api/client.ts](src/api/client.ts)'s helpers, so its response/error parsing is separate from the `ApiError`/`apiSend` path used everywhere else post-login — keep that in mind if login error handling needs to change.

### File uploads
Uploaded via `multer.memoryStorage()` (10MB limit, extension allowlist in [server/src/services/fileService.ts](server/src/services/fileService.ts)), then written to disk under `UPLOAD_DIR/<artifactId>/<uuid><ext>` with metadata in the `artifact_files` table. Deleting a file requires being the uploader or holding `artifacts:manage`; deleting an artifact removes its entire upload directory.

### Frontend data flow
`src/api/*.ts` (e.g. [src/api/artifacts.ts](src/api/artifacts.ts)) are the only modules that call the backend — they wrap [src/api/client.ts](src/api/client.ts)'s `apiGet`/`apiGetEnvelope`/`apiSend`/`apiUpload`/`apiDownload`, which attach the bearer token and throw `ApiError` on non-2xx. Components (e.g. [src/components/ArtifactHub.tsx](src/components/ArtifactHub.tsx)) call these functions directly from `useEffect`/handlers — there's no query-cache library, so loading/error state is tracked manually per component. [src/data/artifacts.ts](src/data/artifacts.ts) is static UI config (sidebar folder labels/colors/session dates), not fetched data.

### Config
Env vars via `.env` (see [.env.example](.env.example)): `PORT`, `DATABASE_PATH`, `JWT_SECRET`, `UPLOAD_DIR`. `JWT_SECRET` falls back to an insecure dev default when `NODE_ENV !== 'production'`; in production it must be set explicitly or [server/src/config.ts](server/src/config.ts) throws at boot.

## Existing editor rules

`.cursor/rules/` has two active rule files worth knowing about since they still apply when editing here:
- [frontend.mdc](.cursor/rules/frontend.mdc) (scoped to `src/components/**`, `src/App.tsx`): no Tailwind/MUI/styled-components — reuse the CSS variables and classes already in `src/index.css`; route all data fetching through `src/api/*`, never raw `fetch()` in components; reuse `src/auth/validation.ts` for form validation; preserve `aria-invalid`/`aria-describedby`/`role="alert"` on form errors.
- [testing.mdc](.cursor/rules/testing.mdc) (applies always): before calling any task done, run `npm run build` and fix type errors, run relevant tests if the change touched validation or API code, and don't leave `console.log` debug statements committed.
