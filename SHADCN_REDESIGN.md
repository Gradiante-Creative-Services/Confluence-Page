# Shadcn UI Redesign — Component Replacement Checklist

This document lists every UI element replaced during the shadcn migration.

## Shadcn blocks installed

| Block | Used in |
|-------|---------|
| `login-04` | [`src/components/login-form.tsx`](src/components/login-form.tsx) — card + image login layout |
| `signup-04` | [`src/components/signup-form.tsx`](src/components/signup-form.tsx) — card + image signup layout |
| `login-02` | [`src/components/LandingPage.tsx`](src/components/LandingPage.tsx) — two-column hero grid |
| `sidebar-16` | [`src/components/site-header.tsx`](src/components/site-header.tsx), [`src/components/app-sidebar.tsx`](src/components/app-sidebar.tsx) — hub shell |

## Shadcn UI components added

`alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`

---

## Landing page (new)

| Removed | Replaced with |
|---------|---------------|
| N/A (new page) | `LandingPage` using login-02 `grid min-h-svh lg:grid-cols-2` layout |
| — | `Button` — Sign in / Create account CTAs |
| — | `Badge` — cohort and date tags |
| — | `Card`, `CardHeader`, `CardTitle`, `CardDescription` — feature highlights |
| — | `Separator` — brand divider and section break |

---

## Login

| Removed | Replaced with |
|---------|---------------|
| `.login-page`, `.login-card`, `.login-header`, `.login-body` | login-04 wrapper: `bg-muted` page + `Card` with `CardContent` grid |
| `.login-form` | `FieldGroup` + `<form>` in `login-form.tsx` |
| `.form-field` + `<label>` | `Field` + `FieldLabel` |
| `.form-input` | `Input` |
| `.form-error`, `.form-error-general` | `Alert variant="destructive"` + `FieldDescription` |
| `.btn-primary` | `Button` |
| `.auth-switch-link` | `Button variant="link"` inside `FieldDescription` |
| OAuth / social buttons (not in backend) | Removed |

---

## Signup

| Removed | Replaced with |
|---------|---------------|
| Same legacy form CSS as login | signup-04 `Card` + `CardContent` grid in `signup-form.tsx` |
| `.login-logos` flex layout | Brand row in form header with ThoughtFocus + Gradiante images |
| Single-column name fields | Two-column grid for first/last name and password/confirm |
| OAuth placeholders | Removed |

---

## App routing

| Removed | Replaced with |
|---------|---------------|
| Direct login/signup toggle only | `'landing' \| 'login' \| 'signup'` view state in `App.tsx` |
| `.login-subtitle` loading text | `Skeleton` placeholders |

---

## Artifact Hub shell

| Removed | Replaced with |
|---------|---------------|
| `TitleBar.tsx` (deleted) | `HubSiteHeader` in `site-header.tsx` |
| `.titlebar`, `.brand`, `.breadcrumb` | `Breadcrumb`, `BreadcrumbPage` |
| `.searchwrap input` | `SearchForm` + `SidebarInput` |
| `.sidebar-toggle` | `Button variant="ghost" size="icon-sm"` + `PanelLeftIcon` |
| `.profile-trigger`, `.profile-dropdown*` | `HubUserMenu` — `DropdownMenu`, `Avatar`, `AvatarFallback` |
| `Sidebar.tsx` (deleted) | `HubAppSidebar` in `app-sidebar.tsx` |
| `.sidebar`, `.folder-btn`, `.sidebar-note` | `Sidebar`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarGroup` |
| `.shell`, custom `main` padding | `SidebarProvider`, `SidebarInset` |
| `.page-head`, `.page-head-row` | Tailwind flex header in `ArtifactHub.tsx` |

---

## Hub content components

| Removed | Replaced with |
|---------|---------------|
| `.card`, `.card-tab`, `.chip`, `.contents-empty` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge` |
| `.status-card`, `.status-pill`, `.pipeline`, `.pnode` | `Card`, `Badge`, `Separator` + Tailwind timeline dots |
| `.btn-upload`, `.upload-status*` | `Button` + `UploadIcon`, `Alert` |
| `.hub-loading` | `Skeleton` grid |
| `.form-error-general.hub-error` | `Alert variant="destructive"` |
| `.statusbar`, `.sep` | Fixed footer with `Separator` |

---

## Global theme

| Removed | Replaced with |
|---------|---------------|
| Dark IDE tokens (`--bg-canvas`, `--bg-panel`, `--accent-*`, etc.) | shadcn light `:root` tokens in `index.css` |
| ~1100 lines legacy CSS | ~100 lines: Tailwind/shadcn imports + light theme + `.sr-only` |
| IBM Plex Sans / JetBrains Mono | Geist Variable (via `@fontsource-variable/geist`) |

---

## Files deleted (replaced by shadcn equivalents)

- `src/components/TitleBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/nav-main.tsx`
- `src/components/nav-projects.tsx`
- `src/components/nav-secondary.tsx`
- `src/components/nav-user.tsx`

## Manual verification

1. Run `npm run dev:all`
2. Visit landing → Sign in / Create account navigation
3. Login and signup validation + API error display
4. Authenticated hub: sidebar filter, `/` search focus, upload, sign out
