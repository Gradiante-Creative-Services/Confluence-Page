# DESIGN.md — Confluence Page

Source of truth: this repository. Product names, copy, labels, colors, and structure below are taken from `README.md`, `index.html`, `src/index.css`, `src/components/*`, `src/data/artifacts.ts`, `src/api/types.ts`, `server/openapi.yaml`, `server/migrations/001_init.sql`, `server/seeds/seed.ts`, `server/src/cli.ts`, and validation/error strings. Nothing invented.

---

## Purpose

**Confluence Page** is the ThoughtFocus **AI for Developers** program hub: an authenticated catalog of cohort deliverables (artifacts + files), not a marketing site.

README lead: *“ThoughtFocus AI for Developers hub: a Vite + React UI backed by an Express + SQLite API.”*

That hub is the product. The first signed-in viewport is the artifact catalog. Auth, health, and admin create/upload exist to serve it.

Goals (from README + UI):

- Browse program deliverables by folder (`docs/`, `tests/`, `ops/`, `tools/`, `comms/`), starting with **BRD** and **Architecture**.
- Open an artifact, list its files, upload, download, delete (permission-gated).
- Admins create artifacts. Both `admin` and `member` can read artifacts and upload files.
- Restrict accounts to `@thoughtfocus.com` employee email.

Audience: ThoughtFocus developers in a 10-session weekday-evening cohort (Jul 27 – Aug 7, 2026). Owner shown in the explorer: Gradiante Creative Services.

Document title (`index.html`): `thoughtfocus-ai4dev — Confluence Page`.

---

## Critical files

| File | Why it matters |
|------|----------------|
| `README.md` | Product name, run story, demo accounts, seeded artifacts |
| `index.html` | Title, fonts (JetBrains Mono + IBM Plex Sans), `html.dark` |
| `src/index.css` | Live visual system: canvas/panel tokens, chrome, cards, login, forms |
| `src/App.tsx` | Two states only: auth (login/signup) or `ArtifactHub` |
| `src/components/ArtifactHub.tsx` | Dominant page: titlebar + explorer + catalog + status bar |
| `src/components/StatusCard.tsx` | Session pipeline (D1–D10) above the grid |
| `src/data/artifacts.ts` | Folder labels/colors/icons and session dates |
| `src/api/types.ts` | Artifact/file shape, `FOLDER_COLORS`, `STATUS_LABELS` |
| `src/components/LoginScreen.tsx` / `SignupScreen.tsx` | Gate copy and form labels |
| `src/assets/thoughtfocus-logo.png` | Brand mark (`alt="ThoughtFocus"`) |
| `server/openapi.yaml` | API names: Confluence Page API `/api/v1` |
| `server/migrations/001_init.sql` | Native data: `users`, `artifacts`, `artifact_files` |
| `server/seeds/seed.ts` | Real hub cards: BRD, Architecture, RACI, Blog + sample `.md` files |
| `server/src/validation/artifacts.ts` | Folders, statuses, field limits |
| `src/auth/validation.ts` | Email/password error copy |
| `.cursor/rules/frontend.mdc` | Reuse `src/index.css` tokens; no Tailwind/MUI/shadcn in hub UI unless asked |

`src/components/ui/button.tsx` and shadcn/oklch `--background` tokens exist in CSS but are **not** what the hub screens use. Inherit the custom `:root` tokens (`--bg-canvas`, `--bg-panel`, `--brand-green`, etc.).

---

## Native shape: explorer catalog + session pipeline

Data is a **foldered catalog**, not a dashboard of KPIs.

```
artifacts
  folder: docs | tests | ops | tools | comms
  path:   e.g. docs/BRD/, comms/blog/
  status: draft | in_review | final
  files[] (originalName, relativePath, sizeBytes, uploadedBy)
```

Chrome is an **IDE workspace**:

```
┌─────────────────────────────────────────────────────────────┐
│ [explorer] ThoughtFocus   thoughtfocus-ai4dev / Confluence Page   [Go to folder… /] [Sign out] │
├──────────┬──────────────────────────────────────────────────┤
│ Explorer │  Confluence Page                    [New artifact]│
│ all      │  Program deliverables for the AI for Developers   │
│ docs/    │  cohort. Browse folders below — starting with     │
│ tests/   │  BRD and Architecture.                            │
│ ops/     │  ┌─────────────────────────────────────────────┐  │
│ tools/   │  │ Current Status · ops/status/  starts tomorrow│  │
│ comms/   │  │ D1 ——— D2 ——— … ——— D10  (session pipeline) │  │
│          │  └─────────────────────────────────────────────┘  │
│ program  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ owner    │  │ BRD      │ │ Arch…    │ │ RACI     │  …       │
│ run      │  └──────────┘ └──────────┘ └──────────┘          │
│          │  [selected] Artifact files panel (list/upload)    │
├──────────┴──────────────────────────────────────────────────┤
│ branch: main | N folders | last sync: 26 Jul 2026 | email | role | api │
└─────────────────────────────────────────────────────────────┘
```

**What matters before what measures:** the **artifact grid** is the product. The status card is a program-run strip (session 0/10), not a metrics hero. Do not lead with login marketing, health checks, or API versioning.

---

## Visual identity (collected from `src/index.css`)

Tone: dense, technical, calm IDE. Syntax-highlighter accents on a charcoal canvas. ThoughtFocus green for primary actions and brand.

### Color

| Token | Value | Use |
|-------|--------|-----|
| `--bg-canvas` | `#1e2128` | Page / body |
| `--bg-panel` | `#262a33` | Titlebar, sidebar, cards, login card, status card, file panel, status bar |
| `--bg-inset` | `#14161b` | Search, inputs, card tab strip, file rows, login header |
| `--bg-hover` | `#2e333e` | Folder/hover, selected chrome |
| `--text-primary` | `#e8e6e3` | Headings, names, strong labels |
| `--text-muted` | `#8b909c` | Body, breadcrumbs, descriptions |
| `--text-dim` | `#5b606b` | Captions, kbd, empty states, pipeline idle |
| `--accent-keyword` | `#c792ea` | `ops/` |
| `--accent-string` | `#f0a868` | `docs/`, `comms/`; “next” pipeline node |
| `--accent-function` | `#6fb3d2` | `tests/`, `tools/`; text selection |
| `--accent-success` | `#8fbf7f` | Status file path, status pill, status-bar `main` |
| `--accent-danger` | `#e8746b` | Errors, Sign out hover, Delete |
| `--accent-neutral` | `#9aa1ad` | Unused in chrome; keep available |
| `--brand-green` | `#84a66b` | Primary buttons, focus rings, login breadcrumb emphasis |
| `--brand-mint` | `#e8f2e8` | Admin button text, mode-toggle active, switch links |
| `--sidebar-w` | `230px` | Explorer open |
| `--sidebar-w-collapsed` | `58px` | Explorer collapsed (letter icons) |

`--border` is declared as `oklch(0.922 0 0)` in `:root` and overridden under `.dark` to `oklch(1 0 0 / 10%)`. `html` has `class="dark"`. Surfaces are dark panels with hairline borders, not white cards.

Folder colors (`FOLDER_COLORS` / `sidebarFolders`):

- `docs`, `comms` → `--accent-string`
- `tests`, `tools` → `--accent-function`
- `ops` → `--accent-keyword`
- `all` → `--text-primary`

Login page background: radial mix of `--brand-green` at 12% over `--bg-canvas`.

Selection: `--accent-function` fill, `--bg-canvas` text.

### Typography

Loaded in `index.html` (this is the live stack):

- **UI / chrome / headings / labels / buttons:** `'JetBrains Mono'` (`--font-mono`) — titlebar breadcrumb, search, page `h1` (22px / 600), folder buttons (13.5px), chips, status bar (11.5px), form labels (11.5px uppercase, 0.04em tracking).
- **Body / descriptions / inputs:** `'IBM Plex Sans'` (`--font-sans`) — page subtitle 14px / 1.55, card descriptions 13px / 1.55, form inputs 14px.

Do not replace this with Geist for hub screens even though `@fontsource-variable/geist` is imported for unused shadcn theme vars.

Type scale already in CSS:

| Role | Size | Family | Weight |
|------|------|--------|--------|
| Page title | 22px | mono | 600 |
| Login / modal title | 18px | mono | 600 |
| File panel title | 16px | inherit | — |
| Body / subtitle | 13–14px | sans | 400 |
| Card name | 13.5px | mono | 600 |
| Path / count / chip | 10.5–11px | mono | 400–600 |
| Sidebar title | 11px | mono | uppercase, 0.08em |
| Kbd `/` | 10px | mono | — |

### Spacing, radius, motion

- Titlebar: 9px 18px, gap 14px
- Main: 26px 30px 60px (20px on ≤760px)
- Grid: `auto-fill`, min 270px, gap 16px
- Cards/panels: padding 12–22px; radius **8px** on cards, status, login, file panel, modal; **6px** search/file-row; **5px** buttons/inputs/folder rows; pills **20px**
- Primary/submit min-height **44px**; secondary/danger **36px**; sign out **32px**; sidebar toggle **26×26**
- Transitions: 0.12–0.16s ease (border, color, sidebar width). Card hover: `translateY(-2px)` + border → folder color
- Pipeline “next” node: 2.2s pulse on `--accent-string`; **off** when `prefers-reduced-motion: reduce`
- Breakpoint: **760px** — sidebar becomes overlay; collapsed width 0; titlebar wraps; search full width

Focus: `2px solid var(--brand-green)`, offset 2px (login/admin/sign-out/toggle). Invalid inputs: `--accent-danger` border. Errors: `role="alert"`, `aria-invalid`, `aria-describedby`.

---

## Screens (real copy only)

### 1. Sign in — `LoginScreen`

Gate. Centered card, max-width 440px.

- Breadcrumb: `Confluence Page / login` (`login` in `--brand-green`)
- Title: **Sign in**
- Subtitle: *Use your ThoughtFocus employee email to open Confluence Page.*
- Fields: **Email** (`you@thoughtfocus.com`), **Password** (`Enter your password`)
- Submit: **Sign in** / **Signing in…**
- Switch: *Don't have an account?* **Create one**
- Errors: `Please fix the errors below to continue.` · `Email is required` · `Enter a valid @thoughtfocus.com email` · `Password is required` · `Password must be at least 8 characters with a letter and a number` · `Invalid email or password` · `Could not reach the API. Start the server with npm run dev, then try again.`

Passwords are **not** shown in the login UI (README). Do not put demo credentials on this screen.

### 2. Sign up — `SignupScreen`

Same chrome.

- Breadcrumb: `Confluence Page / signup`
- Title: **Sign up**
- Subtitle: *Use your ThoughtFocus employee email to create a Confluence Page account.*
- Submit: **Create account** / **Creating account…**
- Switch: *Already have an account?* **Sign in**
- Extra error: `An account with this email already exists`

Signup always creates `role: member` (API: “Create a member account”).

### 3. Artifact hub — dominant page

**Page title:** Confluence Page  
**Subtitle:** *Program deliverables for the AI for Developers cohort. Browse folders below — starting with BRD and Architecture.*  
**Admin action:** **New artifact** (`artifacts:manage` only)

**Titlebar**

- `aria-label`: Toggle explorer
- Breadcrumb: `thoughtfocus-ai4dev / Confluence Page`
- Search: placeholder **Go to folder…**, `aria-label` Search artifacts, kbd `/`
- **Sign out**

**Explorer** (`sidebar-title`: Explorer)

| id | label | icon |
|----|-------|------|
| all | all | A |
| docs | docs/ | D |
| tests | tests/ | T |
| ops | ops/ | O |
| tools | tools/ | X |
| comms | comms/ | C |

Note block:

- **program** — AI for Developers — ThoughtFocus  
- **owner** — Gradiante Creative Services  
- **run** — Jul 27 – Aug 7, 2026 · weekday evenings  

**Status card** (above the grid, not instead of it)

- `Current Status · ops/status/`
- Pill: `starts tomorrow`
- Pipeline nodes: D1–D10 from `sessionDates` (Mon Jul 27 … Fri Aug 7); D1 is `.next`
- Foot: Session **0 / 10** complete · Next: **Day 1 · Mon Jul 27** · Format: **Weekday evenings** · Cohort: **ThoughtFocus developers**

**Grid cards** (seeded examples — use these, not lorem):

| name | path | description | status | folder |
|------|------|-------------|--------|--------|
| BRD | docs/BRD/ | Scope, objectives, and success metrics for the 10-session program. | Final | docs |
| Architecture | docs/architecture/ | Lab environment design, reference builds, and the RAG + MCP setup used in exercises. | Final | docs |
| RACI | docs/RACI/ | Roles and responsibilities across the program — Responsible, Accountable, Consulted, Informed. | In review | docs |
| Blog | comms/blog/ | Cohort updates, session recaps, and shared learning notes. | Draft | comms |

Card anatomy: folder icon + name + file count · path · description · `empty — upload a file to get started` **or** `N file(s)` · status chip (`Draft` / `In review` / `Final`).

States: `Loading artifacts…` · `No artifacts in this folder.` · `Could not load artifacts`

**Status bar:** `branch: main` · `{n} folder(s)` · `last sync: 26 Jul 2026` · email · `role: admin|member` · `api: live|mock`

### 4. New artifact — modal

Title: **New artifact**  
Fields: **Name**, **Folder** (`docs/` `tests/` `ops/` `tools/` `comms/`), **Status** (`draft` `in review` `final`), **Description**  
Actions: **Cancel** · **Create** / **Creating…**  
Validation: `Name is required` · `Description is required` · `Could not create artifact` · `An artifact with this slug already exists` · `An artifact with this path already exists`

### 5. Artifact files — panel under the grid

`aria-label`: Artifact files  
Heading: artifact `name` (fallback **Files**) + `path`  
**Close** · list `originalName` + `relativePath` · **Download** · **Delete** (uploader or admin)  
Empty: `No files yet.` · `Loading files…`  
Upload label: **Upload file** / **Uploading…**  
Errors: `Could not load files` · `Upload failed` · `Delete failed` · `Download failed` · `File type is not allowed` · `File exceeds the 10 MB limit` · `You can only delete files you uploaded`

Allowed extensions (do not invent others): `.md .txt .pdf .png .jpg .jpeg .json .yml .yaml .html .zip`

Seeded files: `scope.md`, `overview.md`, `matrix.md`, `intro.md`.

---

## Component patterns to keep

- **Chrome sandwich:** sticky titlebar + flex shell (explorer | main) + sticky status bar.
- **Panel surfaces:** `--bg-panel`, 1px border, 8px radius. Inset wells for inputs and card tabs.
- **Folder as identity:** `--folder-color` / `--card-color` on chevron, collapsed glyph, card border hover, count pill, status chip.
- **Primary = brand green fill**, dark text (`--bg-inset`). Admin = green-tinted outline, mint label. Danger = coral tint. Secondary = transparent + border.
- **Mono for structure, sans for reading.**
- **Forms:** uppercase mono labels, 44px inputs, inline `form-error` under the field, general errors in a danger-tinted box.

Do not wrap cards in cards. Do not use a centered marketing hero. Do not show a light shadcn theme on these screens.

---

## Roles and permissions (labels that may appear)

| Role | Permissions |
|------|-------------|
| `admin` | `artifacts:read`, `artifacts:manage`, `uploads:create` |
| `member` | `artifacts:read`, `uploads:create` |

API (`server/openapi.yaml`): Confluence Page API, `/api/v1`. Auth: `Authorization: Bearer <token>`. CLI: `tsx server/src/cli.ts <migrate|seed>`.

HTTP copy that may surface: `Authentication required` · `Insufficient permissions` · `Artifact not found` · `Database unavailable`.

---

## Hierarchy (what matters before what measures)

1. **ThoughtFocus mark + Confluence Page** in the titlebar — where you are.
2. **Artifact grid** — the hub. Weight, space, and interaction go here first.
3. **Explorer folders + counts** — how the catalog is sliced.
4. **Status pipeline** — program timing; supporting, not the destination.
5. **File panel** — appears after a card is selected; detail, not the landing state.
6. **Status bar** — branch/sync/role/api; footer telemetry only.

---

## Do / don't

**Do**

- Use real names: Confluence Page, ThoughtFocus, AI for Developers, thoughtfocus-ai4dev, BRD, Architecture, RACI, Blog.
- Keep the explorer + catalog + pipeline composition.
- Keep dark canvas `#1e2128` and panel `#262a33`.
- Keep JetBrains Mono + IBM Plex Sans.
- Gate **New artifact** on admin; show **Upload file** for both roles.

**Don't**

- Invent folders, statuses, artifacts, taglines, or session dates.
- Put `Admin123!` / `Member123!` on login.
- Lead with “Vite + React + Express” as UI copy (that is README for developers).
- Redesign as a generic SaaS landing page, light dashboard, or purple-gradient AI template.
- Treat unused shadcn oklch tokens as the product look.
