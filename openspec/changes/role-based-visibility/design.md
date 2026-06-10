# Design: Visibilidad por Rol

## Enfoque Técnico

Centralizar la autorización en `lib/auth/authorize.ts` con tres helpers (`requireRole`, `requireAuth`, `roleGte`) y aplicarlos consistentemente en 5 capas: navegación → páginas servidor → server actions → componentes cliente → servicios. El patrón existente más maduro (pedidos) sirve como referencia para estandarizar el resto.

## Decisiones de Arquitectura

### Decisión: Helper de autorización unificado

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `redirect()` interno | Rompe el patrón `{ data, error }` existente | ❌ |
| `throw new Error()` | No encaja con `{ error }` existente | ❌ |
| Return `string \| null` con error opcional | Sigue el patrón `checkSuperAdmin` en usuarios/actions.ts; el caller decide qué hacer | ✅ |

**Elección**: Cada helper retorna `string | null` (error message o null). El caller decide si renderiza redirect, muestra mensaje, o retorna `{ error }`.

### Decisión: Jerarquía de roles

```
SUPERADMIN = 3
ADMIN      = 2
DOMICILIARIO = 1
```

`roleGte(user, "ADMIN")` → true para ADMIN y SUPERADMIN.

### Decisión: Server action guard pattern

Por consistencia con el código existente, se llama `auth()` dentro de la acción y se aplica el helper al inicio:

```ts
export async function createArticuloAction(raw: CreateArticuloInput) {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };
  // ... resto de la acción
}
```

### Decisión: Page-level gate

Los server components llaman `auth()`, verifican con `roleGte`, y hacen `redirect("/no-autorizado")` si no pasan. Se crea la página estática `/no-autorizado`.

### Decisión: Cliente recibe rol como prop

El server page pasa `userRole` al client component. No se usa contexto global de auth — sigue el patrón existente de `ClienteList` y `PedidoDetail`.

### Decisión: NavLinks filtrado por rol

`NavLinks` recibe `userRole` como prop opcional. El array de links se enriquece con metadata de rol mínimo requerido y se filtra en el componente. Esto evita crear múltiples variantes del componente y mantiene la lógica visible.

## Flujo de Datos

```
                   ┌──────────────────────────┐
                   │     Layout (server)      │
                   │  session → userRole      │
                   └────┬──────┬──────┬───────┘
                        │      │      │
              ┌─────────┘      │      └──────────┐
              ▼                ▼                  ▼
       ┌────────────┐  ┌────────────┐  ┌────────────────┐
       │  Sidebar   │  │MobileHeader│  │  Page (server) │
       │ → NavLinks │  │ → UserMenu │  │  roleGte gate  │
       │ (filtrado) │  │ (Config    │  └───────┬────────┘
       └────────────┘  │  condicional)│          │
                       └────────────┘          ▼
                                        ┌──────────────┐
                                        │  Client Comp │
                                        │  (userRole   │
                                        │   prop)      │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ Server Action │
                                        │ requireRole() │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   Service     │
                                        │ (filtrado x  │
                                        │  rol si aplica│
                                        └──────────────┘
```

## Archivos Afectados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `lib/auth/authorize.ts` | Crear | Helpers requireRole, requireAuth, roleGte |
| `app/no-autorizado/page.tsx` | Crear | Página estática de acceso denegado |
| `components/layout/nav-links.tsx` | Modificar | Aceptar userRole prop, filtrar links |
| `components/layout/sidebar.tsx` | Modificar | Recibir y pasar userRole a NavLinks |
| `components/layout/bottom-nav.tsx` | Modificar | Recibir y pasar userRole a NavLinks |
| `components/layout/user-menu.tsx` | Modificar | Ocultar Configuración si no SUPERADMIN |
| `components/layout/mobile-header.tsx` | Modificar | Pasar userRole a UserMenu |
| `app/(dashboard)/layout.tsx` | Modificar | Pasar userRole a Sidebar, MobileHeader, BottomNav |
| `app/(dashboard)/page.tsx` | Modificar | Filtrar quickActions por rol |
| `app/(dashboard)/articulos/page.tsx` | Modificar | Gate roleGte("ADMIN"), pasar userRole |
| `app/(dashboard)/articulos/actions.ts` | Modificar | requireRole en mutaciones |
| `components/articulos/ArticleList.tsx` | Modificar | userRole prop, ocultar botones si DOMICILIARIO |
| `components/articulos/ArticleCard.tsx` | Modificar | userRole prop, ocultar editar/toggle |
| `components/articulos/ArticleRow.tsx` | Modificar | userRole prop, ocultar editar/toggle |
| `app/(dashboard)/pedidos/page.tsx` | Modificar | Pasar userRole |
| `app/(dashboard)/pedidos/actions.ts` | Modificar | requireRole("ADMIN") en createPedidoAction |
| `components/pedidos/PedidoList.tsx` | Modificar | userRole prop, ocultar FAB si DOMICILIARIO |
| `app/(dashboard)/clientes/page.tsx` | Modificar | Gate roleGte("ADMIN") |
| `app/(dashboard)/clientes/actions.ts` | Modificar | requireRole en mutaciones |
| `app/(dashboard)/informes/page.tsx` | Modificar | Gate roleGte("ADMIN") |
| `app/(dashboard)/informes/caja/actions.ts` | Modificar | requireRole("ADMIN") en createMovimientoAction |
| `app/(dashboard)/pedidos/create/page.tsx` | Modificar | Gate roleGte("ADMIN") |
| `lib/services/articulos.ts` | Modificar | Filtrado opcional por rol en queries |
| `lib/services/clientes.ts` | Modificar | Filtrado opcional por rol en queries |
| `lib/services/informes.ts` | Modificar | Filtrado opcional por rol en queries |
| `lib/services/movimientos.ts` | Modificar | Sin cambios (ya cubierto por action guards) |

## Interfaces / Contratos

```ts
// lib/auth/authorize.ts

export type Rol = "SUPERADMIN" | "ADMIN" | "DOMICILIARIO";

const HIERARCHY: Record<Rol, number> = {
  DOMICILIARIO: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
};

/** Retorna string de error si el usuario no tiene el rol requerido, null si autorizado */
export function requireRole(
  required: Rol | Rol[],
  user: { rol?: string } | null | undefined,
): string | null;

/** Retorna string de error si el usuario no está autenticado */
export function requireAuth(
  user: unknown | null | undefined,
): string | null;

/** Retorna true si el rol del usuario es >= al mínimo requerido */
export function roleGte(
  user: { rol?: string } | null | undefined,
  minRol: Rol,
): boolean;
```

El rol se pasa de servidor a cliente como prop:

```ts
// Pattern: server page → client component
// Server Component:
const userRole = (session.user as { rol?: string }).rol;
return <ClientComponent userRole={userRole} />;

// Client Component:
interface Props { userRole?: string; }
```

## Estrategia de Testing (Manual)

No hay test runner. Se verifica manualmente con matriz rol × página × acción:

| Página | SUPERADMIN | ADMIN | DOMICILIARIO |
|--------|-----------|-------|--------------|
| Dashboard | ✅ Todo visible | ✅ Todo visible | ✅ Solo stats, sin Acciones Rápidas |
| Artículos | ✅ CRUD completo | ✅ CRUD completo | 🚫 Redirigido |
| Pedidos | ✅ CRUD + FAB | ✅ CRUD + FAB | ✅ Solo lectura + listado, sin FAB |
| Clientes | ✅ CRUD + FAB | ✅ CRUD + FAB | 🚫 Redirigido |
| Informes | ✅ Todos | ✅ Todos | 🚫 Redirigido |
| Configuración | ✅ Acceso | 🚫 Sin link, mensaje en URL directa | 🚫 Sin link |
| Usuarios | ✅ (existente) | 🚫 Sin link | 🚫 Sin link |

Verificar también:
- URL directa a `/articulos` como DOMICILIARIO → redirect a `/no-autorizado`
- Llamada directa a `createArticuloAction` como DOMICILIARIO → `{ error }`
- NavLinks sidebar mobile/desktop filtrados
- User-menu sin "Configuración" para ADMIN/DOMICILIARIO

## Migración / Rollout

Entregado en PRs apilados (stacked-to-main), cada uno reversible independientemente:

| Batch | Contenido | Límite ~lines | Revertible |
|-------|-----------|---------------|------------|
| B1 | `lib/auth/authorize.ts` + `/no-autorizado` | 50 | ✅ |
| B2 | Filtrado navegación (layout, sidebar, nav-links, user-menu) | 120 | ✅ |
| B3 | Server action guards + page-level gates | 150 | ✅ |
| B4 | Client components condicionales (ArticleList, PedidoList, FABs) | 120 | ✅ |
| B5 | Service-layer data filtering (si hace falta) | 80 | ✅ |

No hay cambios de esquema DB. Rollback de cada batch = `git revert` del commit.

## Preguntas Abiertas

- Ninguna — todas las decisiones están cubiertas por los specs existentes y los patrones del código base.
