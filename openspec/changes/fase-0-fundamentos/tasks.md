# Tasks: Fase 0 — Fundamentos

> Envichips SaaS · Implementation breakdown

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-800 (11 new files + 2 modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-1 (Foundation: deps + shadcn + auth) → PR-2 (Dashboard shell: layout + sidebar + bottom-nav) → PR-3 (Seed + migration + verify) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Auth foundation: deps, Zod schema, login page, middleware | PR-1 | Base: `main`. Includes seed of SuperAdmin via env to keep PR-1 testable |
| 2 | Dashboard shell: NavLinks, Sidebar, BottomNav, Dashboard layout, home | PR-2 | Base: `main`. Depends on PR-1 (uses middleware + shadcn) |
| 3 | Seed script + migration + end-to-end verify | PR-3 | Base: `main`. Independent infra task |

Rationale: PR-1 establishes the auth gate. PR-2 fills the protected area. PR-3 closes the loop with seed data so the app is actually usable. Each slice is reviewable in isolation.

## Phase 1: Foundation (PR-1)

### T-01 · Install dependencies and shadcn components

- **Files to create/modify**: `package.json`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`
- **Dependencies**: none
- **Acceptance**:
  - GIVEN `package.json` is at the pre-Fase-0 state
  - WHEN `npm install` runs after adding `tsx` (devDep) and `lucide-react` is verified present
  - AND `npx shadcn@latest add card input label` runs
  - THEN `package.json` lists `tsx` in devDependencies, `lucide-react` in dependencies, and the three shadcn component files exist under `components/ui/`
- **Effort**: 0.5h
- **Risk**: low

### T-02 · Zod validation schema for login

- **Files to create**: `lib/validations/auth.ts`
- **Dependencies**: T-01
- **Acceptance**:
  - GIVEN a malformed payload `{ email: "not-an-email", password: "" }`
  - WHEN the schema parses it
  - THEN parsing fails with field-level errors for both fields
  - GIVEN a valid payload `{ email: "a@b.com", password: "x" }`
  - WHEN the schema parses it
  - THEN it returns a typed object with `email: string` and `password: string`
- **Effort**: 0.25h
- **Risk**: low

### T-03 · Login page with Server Action

- **Files to create**: `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts` (or inline server action in `page.tsx`)
- **Dependencies**: T-01, T-02
- **Acceptance**:
  - GIVEN a user with an inactive session navigates to `/login`
  - WHEN the page loads
  - THEN the login Card renders with email + password inputs and a submit button
  - GIVEN valid credentials
  - WHEN the form submits
  - THEN the user is redirected to `/dashboard`
  - GIVEN invalid credentials
  - WHEN the form submits
  - THEN the page re-renders with the message "Credenciales inválidas" and the submit button is re-enabled
- **Effort**: 2h
- **Risk**: low

### T-04 · Next.js middleware for route protection

- **Files to create**: `app/middleware.ts` (or `middleware.ts` at project root, design says `app/middleware.ts`)
- **Dependencies**: T-01
- **Acceptance**:
  - GIVEN an unauthenticated request to `/dashboard`
  - WHEN the middleware runs
  - THEN it redirects to `/login?callbackUrl=/dashboard`
  - GIVEN a request to `/login` with a valid JWT
  - WHEN the middleware runs
  - THEN it redirects to `/dashboard`
  - GIVEN a request to `/api/auth/session` or `/_next/static/...`
  - WHEN the middleware runs
  - THEN it does not interfere (matcher excludes these)
- **Effort**: 1h
- **Risk**: medium (matcher misconfig can cause redirect loops)

### T-05 · Root page redirect

- **Files to modify**: `app/page.tsx`
- **Dependencies**: T-04
- **Acceptance**:
  - GIVEN a user hits `/`
  - WHEN the page renders (server component)
  - THEN it redirects to `/dashboard` if authenticated, otherwise to `/login`
- **Effort**: 0.25h
- **Risk**: low

## Phase 2: Dashboard Shell (PR-2)

### T-06 · Shared NavLinks component

- **Files created**: `components/layout/nav-links.tsx`
- **Dependencies**: T-01
- **Status**: ✅ Complete
- **Acceptance**:
  - GIVEN the NavLinks component renders
  - WHEN the user is on `/dashboard/pedidos`
  - THEN the "Pedidos" link has an active visual style and the others do not
  - AND all five links (Dashboard, Artículos, Pedidos, Clientes, Informes) are present with their lucide icons
- **Effort**: 1h
- **Risk**: low

### T-07 · Sidebar (desktop)

- **Files created**: `components/layout/sidebar.tsx`
- **Dependencies**: T-06
- **Status**: ✅ Complete
- **Acceptance**:
  - GIVEN the viewport is ≥768px
  - WHEN the dashboard layout renders
  - THEN the sidebar is visible on the left with logo, NavLinks, user name, and a logout button
  - AND on a viewport <768px the sidebar is hidden (`hidden md:flex`)
- **Effort**: 1.5h
- **Risk**: low

### T-08 · BottomNav (mobile)

- **Files created**: `components/layout/bottom-nav.tsx`
- **Dependencies**: T-06
- **Status**: ✅ Complete
- **Acceptance**:
  - GIVEN the viewport is <768px
  - WHEN the dashboard layout renders
  - THEN the bottom nav is fixed at the bottom with icon-only NavLinks
  - AND on a viewport ≥768px the bottom nav is hidden (`flex md:hidden`)
- **Effort**: 1.5h
- **Risk**: low

### T-09 · Dashboard layout

- **Files created**: `app/(dashboard)/layout.tsx`
- **Dependencies**: T-07, T-08
- **Status**: ✅ Complete
- **Acceptance**:
  - GIVEN a request to any `/dashboard/*` route
  - WHEN the layout renders
  - THEN it fetches the session via `auth()` and passes the user name to Sidebar/Header
  - AND the main content area is padded correctly on both mobile (bottom) and desktop (left)
  - AND `signOut` is wired to a button that redirects to `/login`
- **Effort**: 1.5h
- **Risk**: medium (responsive padding regressions)

### T-10 · Dashboard home page

- **Files created**: `app/(dashboard)/page.tsx`
- **Dependencies**: T-09
- **Status**: ✅ Complete
- **Acceptance**:
  - GIVEN a logged-in user reaches `/dashboard`
  - WHEN the page renders
  - THEN it shows "Bienvenido, {nombre}", four hardcoded summary Cards (Ventas hoy, Pedidos pendientes, Stock bajo, Clientes en deuda), and three Quick Action buttons linking to future module routes
  - AND the layout is 2 columns on desktop, 1 column on mobile
- **Effort**: 1.5h
- **Risk**: low

## Phase 3: Seed + Migration (PR-3)

### T-11 · Seed script

- **Status**: ✅ Complete
- **Files created**: `prisma/seed.ts`
- **Files modified**: `package.json` (added `"prisma": { "seed": "tsx prisma/seed.ts" }`)
- **Dependencies**: T-01 (tsx installed)
- **Acceptance**:
  - GIVEN the database has no rows
  - WHEN `npx prisma db seed` runs
  - THEN one SuperAdmin user (`admin@envichips.com` / bcrypt of `admin123`) and 10 articles are created
  - GIVEN the seed runs a second time
  - WHEN it executes
  - THEN no duplicate rows are created (upsert by email for user; findFirst+create for articles since there is no unique field on name)
- **Effort**: 1.5h
- **Risk**: medium (Prisma client import path correctness with the custom `output` in `schema.prisma`)

### T-12 · Run migration and verify end-to-end

- **Status**: ✅ Complete
- **Files created**: `prisma/migrations/20260603152826_init/migration.sql` (generated)
- **Files modified**: `lib/generated/prisma/*` (regenerated)
- **Dependencies**: T-11, PostgreSQL running locally with `envichips_db` database
- **Acceptance**:
  - GIVEN PostgreSQL is running and `DATABASE_URL` points to `envichips_db`
  - WHEN `npx prisma migrate dev --name init` runs
  - THEN all tables and enums from the schema are created without error
  - AND `npx prisma generate` regenerates the client
  - AND `npx prisma db seed` populates data
  - AND `npx prisma studio` shows User (1 row) and Articulo (10 rows)
  - AND the manual end-to-end check passes: visit `/login`, log in with `admin@envichips.com` / `admin123`, land on `/dashboard`, see the welcome message and the four summary cards
- **Effort**: 1h
- **Risk**: medium (PostgreSQL availability)

## Dependency Graph

```
T-01 (deps + shadcn)
 ├─> T-02 (zod schema)
 │    └─> T-03 (login page)
 │         └─> T-05 (root page redirect)
 └─> T-04 (middleware)
      └─> T-05

T-01
 └─> T-06 (NavLinks)
      ├─> T-07 (Sidebar)
      │    └─> T-09 (dashboard layout)
      │         └─> T-10 (dashboard home)
      └─> T-08 (BottomNav)
           └─> T-09

T-01
 └─> T-11 (seed script)
      └─> T-12 (migrate + verify)
```

## Risk Assessment Summary

| Task | Risk | Notes |
|------|------|-------|
| T-01 | low | Standard package install |
| T-02 | low | Trivial Zod schema |
| T-03 | low | Server Action pattern is well-established in Next 16 |
| T-04 | medium | Middleware matcher bugs are the #1 cause of redirect loops |
| T-05 | low | Server component redirect |
| T-06 | low | Pure presentational |
| T-07 | low | Static layout, breakpoint-driven |
| T-08 | low | Static layout, breakpoint-driven |
| T-09 | medium | Responsive padding + session fetching in one place |
| T-10 | low | Static data, no business logic |
| T-11 | medium | Custom Prisma client output path requires exact import; bcrypt cost = 12 |
| T-12 | medium | Depends on external PostgreSQL being available |

## Recommended Delivery Strategy

**Chained PRs to main** is recommended given the High 400-line budget risk.

- **PR-1** (Foundation): T-01, T-02, T-03, T-04, T-05 — establishes the auth gate. Merges to main independently and lets the user verify the login flow.
- **PR-2** (Dashboard shell): T-06, T-07, T-08, T-09, T-10 — builds the protected area. Merges to main after PR-1.
- **PR-3** (Seed + migration): T-11, T-12 — closes the loop with usable data. Merges to main after PR-2.

Chain strategy is `pending` until the user confirms `stacked-to-main` vs `feature-branch-chain` vs `size:exception`. Given that this is foundational work with no production branch yet, **stacked-to-main** is the natural fit; the orchestrator should ask before apply.
