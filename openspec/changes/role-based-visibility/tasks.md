# Tasks: Visibilidad por Rol

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | 520-620 (repartido en 5 PRs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Utilidad de autorización + /no-autorizado | PR 1 | base = main; ~50 líneas |
| 2 | Filtrado navegación (sidebar, nav, user-menu, layout) | PR 2 | depends on PR 1; ~120 líneas |
| 3 | Page gates + server action guards (articulos, clientes, pedidos, informes) | PR 3 | depends on PR 2; ~150 líneas |
| 4 | Componentes cliente condicionales (ArticleList, ArticleCard, PedidoList) | PR 4 | depends on PR 3; ~120 líneas |
| 5 | Filtrado por rol en servicios (articulos, clientes, informes) | PR 5 | depends on PR 4; ~80 líneas |

## PR 1 — Utilidad de Autorización

- [x] 1.1 Crear `lib/auth/authorize.ts` con `requireAuth`, `requireRole`, `roleGte` y jerarquía `HIERARCHY`
- [x] 1.2 Crear `app/no-autorizado/page.tsx` con mensaje de acceso denegado
- [x] 1.3 Verificar: helpers retornan `string | null`, mapa jerárquico SUPERADMIN > ADMIN > DOMICILIARIO

## PR 2 — Filtrado de Navegación

- [x] 2.1 Modificar `nav-links.tsx` para aceptar `userRole` prop y filtrar links por `roleGte`
- [x] 2.2 Modificar `sidebar.tsx` para recibir `userRole` y pasarlo a NavLinks
- [x] 2.3 Modificar `bottom-nav.tsx` para recibir `userRole` y pasarlo a NavLinks
- [x] 2.4 Modificar `user-menu.tsx` para ocultar "Configuración" si no SUPERADMIN
- [x] 2.5 Modificar `mobile-header.tsx` para pasar `userRole` a UserMenu
- [x] 2.6 Modificar `layout.tsx` para extraer `session.user.rol` y pasarlo a Sidebar, MobileHeader, BottomNav

## PR 3 — Gates de Página + Server Actions

- [x] 3.1 Agregar `roleGte("ADMIN")` en `articulos/page.tsx` y pasar `userRole` a componentes
- [x] 3.2 Agregar `roleGte("ADMIN")` en `clientes/page.tsx`
- [x] 3.3 Agregar `roleGte("ADMIN")` en `informes/page.tsx`
- [x] 3.4 Agregar `roleGte("ADMIN")` en `pedidos/create/page.tsx`
- [x] 3.5 Agregar `requireRole` en `articulos/actions.ts` (create, update, toggleEstado)
- [x] 3.6 Agregar `requireRole` en `clientes/actions.ts` (create, updateClienteAction)
- [x] 3.7 Agregar `requireRole("ADMIN")` en `pedidos/actions.ts` → createPedidoAction
- [x] 3.8 Agregar `requireRole("ADMIN")` en `informes/caja/actions.ts` → createMovimientoAction
- [x] 3.9 Filtrar acciones rápidas en `page.tsx` (dashboard) según `roleGte`

## PR 4 — Componentes Cliente

- [ ] 4.1 Modificar `ArticleList.tsx` para recibir `userRole` y ocultar botones mutación si DOMICILIARIO
- [ ] 4.2 Modificar `ArticleCard.tsx` para ocultar editar/toggle si DOMICILIARIO
- [ ] 4.3 Modificar `ArticleRow.tsx` para ocultar editar/toggle si DOMICILIARIO
- [ ] 4.4 Modificar `PedidoList.tsx` para ocultar FAB si DOMICILIARIO
 - [x] 4.1 Modificar `ArticleList.tsx` para recibir `userRole` y ocultar botones mutación si DOMICILIARIO
 - [x] 4.2 Modificar `ArticleCard.tsx` para ocultar editar/toggle si DOMICILIARIO
 - [x] 4.3 Modificar `ArticleRow.tsx` para ocultar editar/toggle si DOMICILIARIO
 - [x] 4.4 Modificar `PedidoList.tsx` para ocultar FAB si DOMICILIARIO

## PR 5 — Filtrado en Servicios

- [ ] 5.1 Modificar `lib/services/articulos.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
- [ ] 5.2 Modificar `lib/services/clientes.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
- [ ] 5.3 Modificar `lib/services/informes.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
 - [x] 5.1 Modificar `lib/services/articulos.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
 - [x] 5.2 Modificar `lib/services/clientes.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
 - [x] 5.3 Modificar `lib/services/informes.ts` para filtrar queries según rol (DOMICILIARIO → vacío)
