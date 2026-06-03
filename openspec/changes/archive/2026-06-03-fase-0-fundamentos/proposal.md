# Proposal: Fase 0 — Fundamentos

> Envichips SaaS · SDD Change

---

## Intent

Establecer la base técnica sobre la cual se construirán todos los módulos de Envichips (Artículos, Pedidos, Clientes, Informes). Sin estos fundamentos no es posible desarrollar ninguna funcionalidad de negocio.

El proyecto ya tiene el stack instalado y configurado (Next.js, Prisma, NextAuth, shadcn/ui, testing). Esta fase completa lo que falta: la UI de login, la protección de rutas por rol, el layout base con navegación responsive y los datos iniciales para arrancar.

---

## Scope

### In Scope

1. **Login UI** — formulario de inicio de sesión con email + contraseña, usando componentes shadcn/ui (Card, Input, Button, Label)
2. **Middleware de rutas** — protección de rutas por rol usando Next.js `middleware.ts` + NextAuth JWT
3. **Layout base del dashboard** — sidebar (desktop) + bottom navigation (mobile), estructura de layout anidado para rutas protegidas
4. **Página home del dashboard** — ruta `/dashboard` con resumen básico post-login
5. **Seed script** — `prisma/seed.ts` con datos iniciales:
   - Categorías y presentaciones de artículos
   - Artículos base representativos
   - Usuario SuperAdmin por defecto (email: admin@envichips.com)
6. **DB setup** — migración inicial de Prisma, instrucciones para crear la base de datos local en PostgreSQL

### Out of Scope

- Módulos de negocio (Artículos, Pedidos, Clientes, Informes) — son fases siguientes
- Diseño visual definitivo (colores, branding) — se usa el theme default de shadcn/ui
- Página de registro de usuarios — el SuperAdmin crea usuarios desde el panel (Fase de Usuarios)
- Recuperación de contraseña — el SuperAdmin resetea manualmente (v1.5 según PRD)

---

## Deliverables

| # | Deliverable | Archivo |
|---|-------------|---------|
| 1 | Página de login | `app/(auth)/login/page.tsx` |
| 2 | Middleware de autorización | `app/middleware.ts` |
| 3 | Layout del dashboard con sidebar + bottom nav | `app/(dashboard)/layout.tsx` |
| 4 | Página home del dashboard | `app/(dashboard)/page.tsx` |
| 5 | Seed de datos iniciales | `prisma/seed.ts` |
| 6 | Migración Prisma aplicada | `prisma/migrations/` |
| 7 | Instalación de lucide-react | `package.json` |

---

## Technical Approach

### Login UI (`app/(auth)/login/page.tsx`)
- Ruta de grupo `(auth)` para layout limpio sin sidebar
- Formulario con email + password usando Server Actions de Next.js
- Componentes shadcn/ui: Card, Input, Button, Label
- Validación con Zod
- En caso de error, mostrar mensaje en el formulario (no redirect)
- En caso de éxito, redirect a `/dashboard`

### Middleware (`app/middleware.ts`)
- Usar `NextRequest` + `getToken` de NextAuth para leer el JWT
- Definir rutas públicas: `/login`, `/api/auth/`, `/_next/`
- Definir rutas protegidas: `/dashboard`, `/api/protected`
- Verificar rol en el token para rutas que requieran roles específicos
- Redirigir a `/login` si no hay sesión

### Layout de dashboard (`app/(dashboard)/layout.tsx`)
- Grupo de rutas `(dashboard)` para todas las rutas protegidas
- Sidebar para desktop (>768px) con links a módulos futuros
- Bottom navigation para mobile (<768px) con los mismos links
- Usar lucide-react para íconos
- Responsive: sidebar oculto en mobile, bottom nav oculto en desktop
- Incluir header con información del usuario y botón de cerrar sesión

### Seed Script (`prisma/seed.ts`)
- Usar `PrismaClient` directamente
- Verificar existencia antes de insertar (upsert o find + create)
- Usuario SuperAdmin por defecto con bcrypt
- Categorías: PAPA, PLATANO, MADURO, CHICHARRON, ROSQUITA, ROSCA, DETODITO, ARITOS, OTRO
- Presentaciones: G50, G65, G250, G500, OTRO
- 5-8 artículos representativos
- Cliente de ejemplo (opcional)
- Configurar `"prisma": { "seed": "tsx prisma/seed.ts" }` en package.json

### DB Setup
- Usuario debe tener PostgreSQL instalado localmente
- Crear base de datos `envichips`
- Correr `npx prisma migrate dev --name init`
- La migración inicial crea todas las tablas del schema

---

## Dependencies

| Paquete | Razón |
|---------|-------|
| `lucide-react` | Íconos para sidebar y bottom nav |
| `tsx` (dev) | Ejecutar seed script TypeScript |

---

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| PostgreSQL no instalado localmente | Media | Documentar instalación, ofrecer usar Neon/Supabase como alternativa |
| Middleware redirect loop | Baja | Excluir explícitamente `/login` y assets estáticos del matcher |
| Seed duplicado en ejecuciones múltiples | Media | Usar `upsert` o verificar existencia antes de insertar |
| Sidebar vs bottom nav inconsistencias | Baja | Probar en múltiples viewports, usar Tailwind `md:` breakpoint |

---

## Estimated Effort

| Actividad | Esfuerzo |
|-----------|----------|
| Login UI | 1 día |
| Middleware + ruteo | 0.5 día |
| Layout base (sidebar + bottom nav) | 1 día |
| Seed script + migración | 0.5 día |
| Testing + ajustes | 0.5 día |
| **Total** | **3.5 días** |
