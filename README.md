# Confluence Page

ThoughtFocus AI for Developers hub: a Vite + React UI backed by an Express + SQLite API.

## Run locally

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:3001` and the Vite app with `/api` proxied to it. The first boot migrates SQLite and seeds demo data into `data/` (gitignored).

Optional:

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
```

Existing local databases only get new seed artifacts when you re-run `npm run db:seed` (idempotent), or wipe `data/` and restart so first boot seeds again.

## Demo accounts

Passwords are not shown in the login UI.

- Admin: `admin@thoughtfocus.com` / `Admin123!`
- Member: `member@thoughtfocus.com` / `Member123!`

Admin can create artifacts. Both roles can read artifacts and upload files.

## Demo artifacts

Seeded hub cards (with sample files): BRD, Architecture, RACI (`docs/RACI/`), and Blog (`comms/blog/`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + Vite together |
| `npm run dev:server` | Express only |
| `npm run dev:web` | Vite only |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Idempotent demo users, BRD, Architecture, RACI, Blog, sample files |
| `npm test` | Frontend Vitest |
| `npm run test:server` | API + SQLite tests |
| `npm run test:smoke` | Login → create → upload → download → delete |
| `npm run test:all` | Frontend + server tests |

## Ask docs (RAG chatbot)

Set `GEMINI_API_KEY` in `.env` (see `.env.example`). Without it, the API boots but ingest/chat return 503. Embeddings use `gemini-embedding-001`; chat uses `gemini-flash-lite-latest`.

Upload `.txt`, `.md`, `.pdf`, or `.docx` to an artifact — indexing starts automatically. Open **Ask docs** in the hub to ask questions grounded in those files. When an artifact is selected, you can scope answers to that artifact only.

## API

Versioned at `/api/v1`. Contract: [server/openapi.yaml](server/openapi.yaml).

Auth uses a signed JWT in `Authorization: Bearer <token>`. Artifact files live on disk under `data/uploads/` with metadata in SQLite.
