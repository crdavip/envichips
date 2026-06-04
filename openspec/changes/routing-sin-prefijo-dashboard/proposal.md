# Proposal: Eliminar prefijo `/dashboard` de las rutas

## Intent

Toda la app es un dashboard/POS, pero las URLs tienen el prefijo redundante `/dashboard/` (`/dashboard/articulos`, `/dashboard/pedidos`, etc.). Esto ensucia las rutas sin aportar valor. El objetivo es eliminarlo para que queden limpias: `/articulos`, `/pedidos`, `/clientes`, `/informes`.

## Scope

### In Scope
- Mover `app/dashboard/` a un route group `app/(dashboard)/` para que las rutas pierdan el prefijo
- Eliminar `app/page.tsx` (redirect a `/dashboard`) — el dashboard ahora vive en `/`
- Actualizar todos los links (`/dashboard/...` → `/...`)
- Actualizar todos los `revalidatePath("/dashboard/...")` → `"/..."`
- Actualizar imports (`@/app/dashboard/...` → `@/app/(dashboard)/...`)

### Out of Scope
- Cambios visuales o de layout
- Cambios en la lógica de negocio
- Migración de datos o schemas de DB

## Capabilities

### Modified Capabilities
- `routing`: La estructura de rutas cambia: se elimina el segmento `/dashboard` de todas las URLs internas. Las rutas de navegación se simplifican.

## Approach

Usar Route Groups de Next.js App Router. Mover `app/dashboard/` dentro de `app/(dashboard)/`. El route group `(dashboard)` no aporta segmento a la URL, solo agrupa layouts. El layout actual de dashboard (auth guard + sidebar + bottom-nav) se mantiene intacto.

`app/page.tsx` se elimina porque el dashboard ahora sirve `/` directamente desde `(dashboard)/page.tsx`. El layout de dashboard ya redirige a `/login` si no hay sesión.

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `app/dashboard/` | Movido | → `app/(dashboard)/` |
| `app/page.tsx` | Eliminado | Redirect ya no necesario |
| `nav-links.tsx` | Modificado | 4 hrefs `{href: "/dashboard/..."}` → `"/..."` |
| `app/dashboard/page.tsx` | Modificado | 3 hrefs + remover auth check (ya lo hace el layout) |
| `app/dashboard/informes/page.tsx` | Modificado | 5 hrefs + auth check |
| `components/clientes/ClienteList.tsx` | Modificado | 4 hrefs |
| `components/pedidos/PedidoForm.tsx` | Modificado | 3 router.push |
| `components/pedidos/PedidoList.tsx` | Modificado | 8 hrefs |
| `components/pedidos/PedidoDetail.tsx` | Modificado | 1 href |
| `app/dashboard/pedidos/[id]/imprimir/page.tsx` | Modificado | 2 hrefs |
| `app/dashboard/articulos/[id]/historial/page.tsx` | Modificado | 1 href |
| `app/dashboard/articulos/actions.ts` | Modificado | 5 revalidatePath |
| `app/dashboard/pedidos/actions.ts` | Modificado | 3 revalidatePath |
| `app/dashboard/clientes/actions.ts` | Modificado | 4 revalidatePath |
| `app/dashboard/informes/caja/actions.ts` | Modificado | 2 revalidatePath |
| `components/articulos/ArticleList.tsx` | Modificado | Import |
| `components/articulos/ArticleForm.tsx` | Modificado | Import |
| `components/articulos/PurchaseModal.tsx` | Modificado | Import |
| `components/clientes/ClienteForm.tsx` | Modificado | Import |
| `components/clientes/AbonoForm.tsx` | Modificado | Import |
| `components/informes/CajaForm.tsx` | Modificado | Import |
| `app/dashboard/clientes/[id]/page.tsx` | Modificado | Import |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Queda algún `/dashboard/` sin actualizar | Media | Search sistemático con grep antes de finalizar |
| Error en imports por cambio de carpeta | Media | `next build` detecta imports rotos |
| Redirección circular o login loop | Baja | El layout de dashboard ya maneja auth correctamente |

## Rollback Plan

`git revert` del commit. O restaurar `app/dashboard/` y `app/page.tsx` desde git.

## Dependencias

- Ninguna externa. Solo cambios de estructura de archivos Next.js.

## Success Criteria

- [ ] `next build` pasa sin errores
- [ ] `/` carga el dashboard (no redirige a `/dashboard`)
- [ ] `/articulos` muestra la lista de artículos
- [ ] `/pedidos` muestra la lista de pedidos
- [ ] `/clientes` muestra la lista de clientes
- [ ] `/informes` muestra el hub de informes
- [ ] La navegación (sidebar + bottom nav) funciona correctamente
- [ ] Los enlaces internos (acciones rápidas, listas, detalles) funcionan
- [ ] Los formularios (crear pedido, editar artículo, etc.) postean correctamente
- [ ] No hay ningún `/dashboard/` residual en el código
