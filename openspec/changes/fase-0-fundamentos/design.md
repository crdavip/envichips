# Design: Fase 0 — Fundamentos

> Envichips SaaS · Diseño técnico

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Root Layout (/)                       │
│  • Fonts (Geist)                                        │
│  • Globals CSS (Tailwind + shadcn)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                        ▼
   (auth) group             (dashboard) group
   ┌──────────┐          ┌─────────────────────┐
   │  Login   │          │   Dashboard Layout   │
   │  Page    │          │  • Sidebar (desktop) │
   │          │          │  • BottomNav (mobile)│
   └──────────┘          │  • Header            │
                         └─────────┬───────────┘
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                   Dashboard Home     (future modules:
                   • Welcome          artículos, pedidos,
                   • Stats cards      clientes, informes)
                   • Quick actions
```

### Route Design

| Route | Group | Auth | Layout | Purpose |
|-------|-------|------|--------|---------|
| `/login` | `(auth)` | No | None (standalone) | Login form |
| `/dashboard` | `(dashboard)` | Yes | DashboardLayout | Home / welcome |
| `/dashboard/articulos` | `(dashboard)` | Yes | DashboardLayout | Future |
| `/dashboard/pedidos` | `(dashboard)` | Yes | DashboardLayout | Future |
| `/dashboard/clientes` | `(dashboard)` | Yes | DashboardLayout | Future |
| `/dashboard/informes` | `(dashboard)` | Yes | DashboardLayout | Future |
| `/api/auth/[...nextauth]` | `api` | No | None | NextAuth handler |

### Middleware Chain

```
Request → middleware.ts → check JWT → authenticated? → next()
                                        ↓ no
                                   redirect /login
```

---

## 2. File Structure

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx              ← Login form (Server Action)
├── (dashboard)/
│   ├── layout.tsx                ← Dashboard layout (sidebar + bottom nav)
│   ├── page.tsx                  ← Dashboard home (welcome + cards)
│   ├── articulos/page.tsx        ← Future
│   ├── pedidos/page.tsx          ← Future
│   ├── clientes/page.tsx         ← Future
│   └── informes/page.tsx         ← Future
├── api/
│   └── auth/[...nextauth]/
│       └── route.ts              ← NextAuth handler (already exists)
├── globals.css                   ← Already exists (shadcn updated)
├── layout.tsx                    ← Root layout (already exists)
└── page.tsx                      ← Root page (redirect to /dashboard or /login)

components/
├── layout/
│   ├── sidebar.tsx               ← Desktop sidebar
│   ├── bottom-nav.tsx            ← Mobile bottom navigation
│   └── nav-links.tsx             ← Shared nav link definitions
├── ui/                           ← shadcn/ui components
│   ├── button.tsx                ← Already exists
│   ├── card.tsx                  ← To be added
│   ├── input.tsx                 ← To be added
│   └── label.tsx                 ← To be added

lib/
├── auth.ts                       ← NextAuth config (already exists)
├── db.ts                         ← Prisma client (already exists)
├── utils.ts                      ← cn() helper (already exists from shadcn)
├── generated/prisma/             ← Prisma client output (already exists)
└── validations/
    └── auth.ts                   ← Zod schemas for login

prisma/
├── schema.prisma                 ← Already exists
├── seed.ts                       ← Seed script
├── migrations/                   ← Created by prisma migrate
└── config.ts                     ← Already exists

app/
└── middleware.ts                 ← Route protection
```

---

## 3. Component Design

### 3.1 Login Page

```
LoginPage (server component)
├── Card
│   ├── CardHeader → logo + título
│   └── CardContent
│       └── LoginForm (client component)
│           ├── form (action: loginAction — Server Action)
│           │   ├── Input (email)
│           │   ├── Input (password)
│           │   └── Button (submit)
│           └── error message div (conditional)
```

**Data Flow**:
1. User fills form → client-side Zod validation
2. Submit → Server Action `loginAction` calls `signIn("credentials", ...)`
3. Success → NextAuth sets JWT cookie → redirect to `/dashboard`
4. Error → return `{ error: "Credenciales inválidas" }` → display in form

**State**:
- Form state via `useActionState` (React 19) — `{ error?: string }`
- No client-side store needed

### 3.2 Dashboard Layout

```
DashboardLayout (server component — fetches session)
├── Sidebar (client component — uses usePathname)
│   ├── Logo + title
│   ├── NavLinks
│   │   ├── NavLink (Dashboard)     — active matching: /
│   │   ├── NavLink (Artículos)     — active matching: /articulos
│   │   ├── NavLink (Pedidos)       — active matching: /pedidos
│   │   ├── NavLink (Clientes)      — active matching: /clientes
│   │   └── NavLink (Informes)      — active matching: /informes
│   └── UserInfo + LogoutButton
├── Main content area
│   └── {children}
└── BottomNav (mobile only)
    └── NavLinks (same links, icon-only on small screens)
```

**Data Flow**:
- `auth()` call in server layout → get user name + email
- Pass as props to Sidebar/BottomNav or use `useSession` in client
- `signOut()` via NextAuth → redirect to `/login`

**Responsive Breakpoints**:
- Mobile: `< 768px` — BottomNav fixed bottom, sidebar hidden
- Desktop: `>= 768px` — Sidebar fixed left, bottom nav hidden

### 3.3 Dashboard Home

```
DashboardHome (server component)
├── WelcomeSection
│   └── "Bienvenido, {user.nombre}"
├── StatsGrid
│   ├── StatCard (Ventas hoy: $0)
│   ├── StatCard (Pedidos pendientes: 0)
│   ├── StatCard (Stock bajo: 0)
│   └── StatCard (Clientes en deuda: 0)
└── QuickActions
    ├── ActionButton ("Nuevo Pedido" → /dashboard/pedidos/nuevo)
    ├── ActionButton ("Ver Artículos" → /dashboard/articulos)
    └── ActionButton ("Registrar Abono" → /dashboard/clientes)
```

### 3.4 NavLinks (Shared)

```
NavLinks (client component)
Props: {
  isCollapsed?: boolean   // for sidebar collapsed state (future)
  orientation: "horizontal" | "vertical"
  onNavigate?: () => void  // for bottom nav (close mobile menu)
}

Links definition:
[
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/articulos", label: "Artículos", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/informes", label: "Informes", icon: BarChart3 },
]
```

---

## 4. Middleware Design

```typescript
// app/middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/(dashboard)")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and visiting login, redirect to dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 5. Seed Script Design

```typescript
// prisma/seed.ts
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIAS = ["PAPA", "PLATANO", "MADURO", "CHICHARRON", "ROSQUITA", "ROSCA", "DETODITO", "ARITOS", "OTRO"] as const;
const PRESENTACIONES = ["G50", "G65", "G250", "G500", "OTRO"] as const;

// Categories and Presentations are enums — they're created by the migration
// We just need to create articles and users

const ARTICULOS = [
  { nombre: "Papa Limón 65g", categoria: "PAPA", presentacion: "G65", costo: 2250, precio: 2800, stockActual: 100, stockMinimo: 50 },
  { nombre: "Papa Limón 250g", categoria: "PAPA", presentacion: "G250", costo: 4200, precio: 5000, stockActual: 50, stockMinimo: 25 },
  // ... etc
];

async function main() {
  // Upsert articles
  for (const a of ARTICULOS) {
    await db.articulo.upsert({
      where: { id: a.nombre /* need a unique field - use findFirst instead */ },
      // Actually use findFirst + create
    });
  }
  
  // Upsert SuperAdmin
  const password = await bcrypt.hash("admin123", 12);
  await db.user.upsert({
    where: { email: "admin@envichips.com" },
    update: {},
    create: {
      nombre: "Admin Envichips",
      email: "admin@envichips.com",
      password,
      rol: "SUPERADMIN",
    },
  });
}
```

---

## 6. Testing Plan

| File | Test | Type | Tool |
|------|------|------|------|
| `login/page.tsx` | Form renders, validation works | Unit (RTL) | Vitest |
| `login/page.tsx` | Server Action handles errors | Integration | Vitest |
| `middleware.ts` | Redirect when no token | Unit | Vitest (with mocked request) |
| `middleware.ts` | Pass when token exists | Unit | Vitest |
| `sidebar.tsx` | Renders nav links, highlights active | Unit (RTL) | Vitest |
| `bottom-nav.tsx` | Renders on mobile | Unit (RTL) | Vitest |
| `nav-links.tsx` | Active link detection | Unit (RTL) | Vitest |
| `seed.ts` | Creates users and articles without errors | Integration | Vitest (with test DB) |

---

## 7. Implementation Order

```mermaid
graph TD
    A[1. Add shadcn components: Card, Input, Label] --> B[2. Login UI]
    A --> C[3. Middleware]
    B --> D[4. Dashboard Layout]
    C --> D
    D --> E[5. Dashboard Home]
    A --> F[6. Install tsx + lucide-react]
    F --> G[7. Seed Script]
    G --> H[8. Migration + DB setup]
    H --> I[9. Run seed → verify]
    E --> I
```

### Order rationale:
1. **shadcn components first** — needed by both login and layout
2. **Login + Middleware in parallel** — login needs the form components, middleware is independent
3. **Dashboard layout** — depends on middleware (for protection) and shadcn components
4. **Dashboard home** — depends on layout
5. **Seed + migration** — independent setup work, needed for end-to-end verification
6. **Integration test** — run migration + seed, verify login flow

---

## 8. Dependencies to Install

| Package | Command | Why |
|---------|---------|-----|
| `lucide-react` | `npm install lucide-react` | Icons for sidebar/bottom nav |
| `tsx` | `npm install -D tsx` | Run seed script (TypeScript) |

### shadcn components to add
```bash
npx shadcn@latest add card input label
```

---

## 9. Environment Configuration

```env
# .env (already exists, verify values)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/envichips?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-change-in-production"
```

### Database Setup Steps
1. Ensure PostgreSQL is running locally
2. Create database: `createdb envichips` (or via pgAdmin)
3. Run migration: `npx prisma migrate dev --name init`
4. Run seed: `npx prisma db seed`
5. Verify: `npx prisma studio` to browse data
