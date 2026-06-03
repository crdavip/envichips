# Specs: Fase 0 — Fundamentos

> Envichips SaaS · Especificaciones detalladas

---

## 1. Login UI

**File**: `app/(auth)/login/page.tsx`

### Purpose
Pantalla de inicio de sesión con email + contraseña. Es la puerta de entrada al sistema. Solo usuarios registrados y activos pueden acceder.

### Acceptance Criteria
- [ ] La ruta `/login` muestra un formulario centrado con logo de Envichips
- [ ] El formulario tiene campos: email (type="email") y password (type="password")
- [ ] Ambos campos son requeridos y se validan con Zod antes de enviar
- [ ] Al enviar credenciales inválidas, muestra error "Credenciales inválidas" sin redirigir
- [ ] Al enviar credenciales válidas, redirige a `/dashboard`
- [ ] Mientras se procesa el login, el botón se deshabilita y muestra "Iniciando sesión..."
- [ ] Si el usuario ya tiene sesión activa, redirige automáticamente a `/dashboard`
- [ ] La página usa Server Action (`"use server"`) para autenticar via `signIn("credentials", ...)`
- [ ] Componentes shadcn/ui: Card, CardHeader, CardContent, Input, Button, Label
- [ ] Sin sidebar ni navegación — es una página independiente

### Technical Notes
- Usar `import { signIn } from "@/lib/auth"` (el export de NextAuth)
- Zod schema: `{ email: z.string().email(), password: z.string().min(1) }`
- El Server Action debe capturar el error de `signIn` y devolver `{ error: "Credenciales inválidas" }`
- Usar `useActionState` (React 19) o `useFormState` para manejar el estado del formulario
- Incluir en el layout de grupo `(auth)` un layout simple sin sidebar

### Test Scenarios
1. **Login exitoso**: email válido + password correcto → redirect a `/dashboard`
2. **Email inválido**: email mal formateado → error de validación en cliente
3. **Credenciales incorrectas**: email válido + password incorrecto → "Credenciales inválidas"
4. **Usuario inactivo**: usuario con `activo: false` → "Credenciales inválidas" (no revelar estado)
5. **Ya autenticado**: visitar `/login` con sesión activa → redirect a `/dashboard`

---

## 2. Middleware de Rutas

**File**: `app/middleware.ts`

### Purpose
Proteger rutas del dashboard verificando la sesión JWT. Redirigir a `/login` si no hay sesión. Sentar las bases para futura autorización por rol.

### Acceptance Criteria
- [ ] Middleware se ejecuta en rutas configuradas via `config.matcher`
- [ ] Rutas públicas: `/login`, `/api/auth/:path*`, `/_next/:path*`, `/favicon.ico`, imágenes estáticas
- [ ] Rutas protegidas: todas las que empiecen con `/dashboard` o `/(dashboard)`
- [ ] Sin token JWT → redirect a `/login`
- [ ] Con token JWT válido → `next()`
- [ ] El token contiene el campo `rol` (configurado en el JWT callback de NextAuth)
- [ ] No causa redirect loops (verificar que `/login` está excluida del matcher)

### Technical Notes
- Usar `import { getToken } from "next-auth/jwt"` con `secret` de la env var
- El `config.matcher` debe excluir explícitamente `_next/static`, `_next/image`, `favicon.ico`
- No usar `auth()` de NextAuth en middleware porque causa problemas — usar `getToken` directo
- Para futura autorización por rol: agregar verificación de `token.rol` en rutas admin

### Test Scenarios
1. **Sin sesión** → visitar `/dashboard` → redirect a `/login?callbackUrl=/dashboard`
2. **Con sesión** → visitar `/dashboard` → pasa, muestra el dashboard
3. **Ruta pública** → `/login` → siempre accesible
4. **Ruta API auth** → `/api/auth/session` → siempre accesible
5. **Middleware no interfiere** con assets estáticos

---

## 3. Dashboard Layout

**File**: `app/(dashboard)/layout.tsx`

### Purpose
Layout base para todas las páginas protegidas. Sidebar en desktop, bottom navigation en mobile. Header con info del usuario y logout.

### Acceptance Criteria
- [ ] Sidebar visible en desktop (≥768px), oculto en mobile
- [ ] Bottom nav visible en mobile (<768px), oculto en desktop
- [ ] Sidebar contiene: logo/nombre del negocio, nav links, user info, botón logout
- [ ] Bottom nav contiene: íconos + labels de los mismos links
- [ ] Nav links (placeholder con hrefs):
  - Dashboard (`/dashboard`) — LayoutDashboard icon
  - Artículos (`/dashboard/articulos`) — Package icon
  - Pedidos (`/dashboard/pedidos`) — ShoppingCart icon
  - Clientes (`/dashboard/clientes`) — Users icon
  - Informes (`/dashboard/informes`) — BarChart3 icon
- [ ] Link activo resaltado con color diferente
- [ ] Botón logout ejecuta `signOut({ callbackUrl: "/login" })`
- [ ] Header superior con nombre del usuario de la sesión
- [ ] Responsive: contenido principal se adapta al ancho disponible
- [ ] Usar `lucide-react` para todos los íconos

### Technical Notes
- Obtener sesión con `auth()` de `@/lib/auth` en el layout (componente server)
- Pasar nombre de usuario a los hijos via contexto si es necesario, o usar `useSession` en componentes cliente
- Sidebar: `hidden md:flex w-64 flex-col fixed h-full`
- Bottom nav: `flex md:hidden fixed bottom-0 w-full`
- Agregar padding-bottom en mobile para que el contenido no quede detrás de la bottom nav
- Usar `usePathname()` de next/navigation para resaltar link activo (en componente cliente)
- Separar `Sidebar` y `BottomNav` como componentes en `components/layout/`

### Test Scenarios
1. **Desktop (1280px)**: sidebar visible, bottom nav invisible
2. **Mobile (375px)**: sidebar invisible, bottom nav visible
3. **Navegación**: click en link cambia la ruta y resalta el link activo
4. **Logout**: click en logout → redirige a `/login`, sesión destruida
5. **Nombre de usuario**: se muestra en sidebar/header

---

## 4. Dashboard Home

**File**: `app/(dashboard)/page.tsx`

### Purpose
Página de bienvenida post-login. Muestra información básica del usuario y placeholders para futuros widgets del dashboard.

### Acceptance Criteria
- [ ] Mensaje de bienvenida: "Bienvenido, {nombre}" obtenido de la sesión
- [ ] Cards de resumen (valores hardcodeados por ahora):
  - Ventas hoy: "$0"
  - Pedidos pendientes: "0"
  - Artículos con stock bajo: "0"
  - Clientes en deuda: "0"
- [ ] Sección "Acciones rápidas" con botones placeholder:
  - "Nuevo Pedido" → `/dashboard/pedidos/nuevo`
  - "Ver Artículos" → `/dashboard/articulos`
  - "Registrar Abono" → `/dashboard/clientes`
- [ ] Diseño responsive: 2 columnas en desktop, 1 columna en mobile

### Technical Notes
- Componente server-side (`async function`), usa `auth()` para obtener sesión
- Cards con shadcn/ui Card component
- Valores hardcodeados — se conectarán a datos reales en fases siguientes
- Links a rutas que aún no existen (se crearán en fases posteriores) — no rompen, solo dan 404

### Test Scenarios
1. **Carga correcta**: muestra nombre del usuario logueado
2. **Cards visibles**: 4 cards de resumen se renderizan
3. **Acciones rápidas**: 3 botones con links funcionan (aunque den 404)
4. **Responsive**: 2 columnas en desktop, 1 en mobile

---

## 5. Seed Script

**File**: `prisma/seed.ts`

### Purpose
Poblar la base de datos con datos iniciales para desarrollo: categorías, presentaciones, artículos de ejemplo y usuario SuperAdmin por defecto.

### Acceptance Criteria
- [ ] Crea todas las categorías: PAPA, PLATANO, MADURO, CHICHARRON, ROSQUITA, ROSCA, DETODITO, ARITOS, OTRO
- [ ] Crea todas las presentaciones: G50, G65, G250, G500, OTRO
- [ ] Crea 8-10 artículos con nombres, categorías, presentaciones, costos y precios realistas
- [ ] Crea usuario SuperAdmin: admin@envichips.com / admin123 (hash bcrypt)
- [ ] Usa `upsert` para evitar duplicados en ejecuciones sucesivas
- [ ] Configura `package.json` con `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] Se puede ejecutar con `npx prisma db seed`

### Artículos de ejemplo sugeridos

| Nombre | Categoría | Presentación | Costo | Precio |
|--------|-----------|-------------|-------|--------|
| Papa Limón 65g | PAPA | G65 | 2250 | 2800 |
| Papa Limón 250g | PAPA | G250 | 4200 | 5000 |
| Plátano Maduro 65g | PLATANO | G65 | 2000 | 2600 |
| Chicharrón Natural 65g | CHICHARRON | G65 | 2500 | 3200 |
| Rosquita 65g | ROSQUITA | G65 | 1800 | 2400 |
| Rosca 50g | ROSCA | G50 | 1500 | 2000 |
| Detodito 65g | DETODITO | G65 | 2100 | 2700 |
| Maduro 250g | MADURO | G250 | 3800 | 4600 |
| Aritos 65g | ARITOS | G65 | 1900 | 2500 |
| Papa Limón 500g | PAPA | G500 | 7500 | 9000 |

### Technical Notes
- Usar `import { PrismaClient } from "../lib/generated/prisma/client"`
- Usar `import bcrypt from "bcryptjs"` para hashear password
- Ejecutar con `tsx` (instalar como devDependency)
- Agregar `"prisma": { "seed": "tsx prisma/seed.ts" }` en package.json

---

## 6. Migración Inicial

**Comando**: `npx prisma migrate dev --name init`

### Purpose
Crear todas las tablas en PostgreSQL a partir del schema de Prisma.

### Acceptance Criteria
- [ ] Base de datos `envichips` existe en PostgreSQL local
- [ ] La migración se ejecuta sin errores
- [ ] Todas las tablas se crean: User, Articulo, Cliente, Abono, Pedido, PedidoItem, HistorialEstado, Compra, CompraItem, Movimiento
- [ ] Todos los enums se crean: Rol, Categoria, Presentacion, EstadoPedido, MetodoPago, TipoDoc, TipoMovimiento, CategoriaMovimiento
- [ ] Las relaciones entre tablas son correctas
- [ ] Después de migrar, `npx prisma generate` regenera el client

### Technical Notes
- Asegurar que PostgreSQL está corriendo antes de migrar
- La conexión se configura via `DATABASE_URL` en `.env`
- El archivo `prisma.config.ts` ya está configurado para Prisma v6
