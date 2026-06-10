# Propuesta: Visibilidad por Rol

## Intención

Cada rol (SUPERADMIN, ADMIN, DOMICILIARIO) debe ver solo lo que puede usar: navegación, páginas, botones y datos filtrados consistentemente. Hoy los guards de rol se aplican de forma inconsistente — algunas páginas/server actions lo tienen, otras no, y la navegación es idéntica para todos.

## Alcance

### Incluye
- Utilidad compartida de autorización (`requireRole`, helpers) en `lib/auth/authorize.ts`
- Guards de rol en todos los server actions (artículos, clientes, pedidos, movimientos)
- Gates de página en componentes servidor (artículos, pedidos, clientes, informes)
- Filtrado de navegación por rol (sidebar, bottom nav, user menu)
- Render condicional en componentes cliente (botones de mutación, FABs)
- Filtrado de datos por rol en capa de servicios

### Excluye
- Configuración personal (cambiar contraseña) — trabajo futuro
- Middleware de autorización — ideal pero el alcance ya es grande
- Auditoría de acceso — trabajo futuro
- UI de gestión de roles — trabajo futuro (solo SUPERADMIN crea usuarios)
- Configuración se mantiene SUPERADMIN-only (sin opciones por ahora)

## Capacidades

### Nuevas Capacidades
- `autorizacion-compartida`: utilidades reutilizables (`requireRole`, `requireAuth`, `roleGte`) que unifican la verificación de rol en toda la app.

### Capacidades Modificadas
- `articulos`: agregar guards de rol en server actions y filtrado en servicios
- `clientes`: agregar guards de rol en server actions y filtrado en servicios
- `pedidos`: estandarizar guards existentes, agregar faltantes en componentes cliente
- `informes`: agregar guards de rol en server actions de caja y filtrado en servicios
- `routing`: agregar filtrado de navegación por rol (nav-links, bottom-nav)
- `movimientos-caja`: agregar guard de rol en createMovimiento

## Enfoque

Patrón **service-layer gate**: crear `lib/auth/authorize.ts` con helpers, retrofitar server actions, agregar gates en páginas server, filtrar navegación por rol, y hacer que servicios sean role-conscientes (como `getPedidos` ya lo hace).

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `lib/auth/authorize.ts` | Nuevo | Helpers requireRole, requireAuth, roleGte |
| `components/layout/nav-links.tsx` | Modificado | Filtrar links por rol |
| `components/layout/bottom-nav.tsx` | Modificado | Filtrar links por rol |
| `components/layout/sidebar.tsx` | Modificado | Recibir y pasar rol |
| `components/layout/user-menu.tsx` | Modificado | Ocultar Configuración según rol |
| `app/(dashboard)/layout.tsx` | Modificado | Pasar rol a sidebar/nav |
| `app/(dashboard)/page.tsx` | Modificado | Filtrar acciones rápidas por rol |
| `app/(dashboard)/articulos/page.tsx` | Modificado | Gate de página server |
| `app/(dashboard)/articulos/actions.ts` | Modificado | Guards en mutaciones |
| `components/articulos/ArticleList.tsx` | Modificado | Botones condicionales |
| `components/articulos/ArticleCard.tsx` | Modificado | Botones condicionales |
| `app/(dashboard)/pedidos/page.tsx` | Modificado | Gate de página server |
| `components/pedidos/PedidoList.tsx` | Modificado | FAB condicional |
| `app/(dashboard)/pedidos/actions.ts` | Modificado | Guards faltantes |
| `app/(dashboard)/clientes/page.tsx` | Modificado | Gate de página server |
| `app/(dashboard)/clientes/actions.ts` | Modificado | Guards en mutaciones |
| `app/(dashboard)/informes/page.tsx` | Modificado | Gate de página server |
| `app/(dashboard)/informes/caja/actions.ts` | Modificado | Guard en createMovimiento |
| `lib/services/articulos.ts` | Modificado | Filtrado por rol |
| `lib/services/clientes.ts` | Modificado | Filtrado por rol |
| `lib/services/informes.ts` | Modificado | Filtrado por rol |
| `lib/services/movimientos.ts` | Modificado | Filtrado por rol |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Romper acceso existente (falsos negativos) | Media | Tests manuales con cada rol tras cada batch |
| Dejar un server action sin guard | Media | Revisión sistemática: todo `actions.ts` debe tener guard |
| Sidebar/nav sin filtrar en algunos estados | Baja | Inspección visual post-cambio |

## Plan de Rollback

Cada batch en los PRs apilados se revierte independientemente. No hay cambios de esquema DB. Batches: (1) utilidad de autorización, (2) navegación, (3) pages + actions, (4) componentes cliente, (5) servicios.

## Dependencias

Ninguna externa. Depende de NextAuth ya configurado con `session.user.rol` en el JWT.

## Criterios de Éxito

- [ ] DOMICILIARIO solo ve Dashboard y Pedidos en navegación
- [ ] ADMIN y SUPERADMIN ven todas las secciones
- [ ] DOMICILIARIO no puede acceder a páginas de Artículos, Clientes, Informes
- [ ] DOMICILIARIO no ve botones de crear/editar/eliminar en componentes cliente
- [ ] Todos los server actions verifican rol antes de mutar
- [ ] Servicios filtran datos por rol (DOMICILIARIO solo ve datos relevantes)
