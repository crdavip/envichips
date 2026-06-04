# Tasks: Eliminar prefijo `/dashboard` de las rutas

## Review Workload Forecast

- **Estimated changed files**: ~25 files
- **Estimated changed lines**: ~80-100 lines (mostly hrefs and paths)
- **400-line budget risk**: Low — well under 400 lines
- **Chained PRs recommended**: No
- **Decision needed before apply**: No

## Tasks

### T1: Mover `app/dashboard/` a `app/(dashboard)/`

- [x] `mv app/dashboard app/(dashboard)` (copied + removed original)
- [x] Verificar que el layout se mantiene intacto

### T2: Eliminar `app/page.tsx`

- [x] Eliminar el archivo raíz que redirige a `/dashboard`
- [x] El dashboard ahora vive en `(dashboard)/page.tsx` que sirve `/`

### T3: Actualizar links de navegación

**Archivo: `components/layout/nav-links.tsx`**
- [x] `/dashboard` → `/`
- [x] `/dashboard/articulos` → `/articulos`
- [x] `/dashboard/pedidos` → `/pedidos`
- [x] `/dashboard/clientes` → `/clientes`
- [x] `/dashboard/informes` → `/informes`
- [x] `isActive("/dashboard")` → `isActive("/")`

### T4: Actualizar acciones rápidas y links internos del dashboard

**Archivo: `app/(dashboard)/page.tsx`**
- [x] `/dashboard/pedidos/create` → `/pedidos/create`
- [x] `/dashboard/articulos` → `/articulos`
- [x] `/dashboard/clientes` → `/clientes`
- [x] Remover `auth()` + `redirect("/login")` (redundante con el layout)

### T5: Actualizar links en informes

**Archivo: `app/(dashboard)/informes/page.tsx`**
- [x] Los 5 hrefs en subReportNav: `/dashboard/informes/...` → `/informes/...`
- [x] Remover `auth()` + `redirect("/login")` (redundante)

### T6: Actualizar revalidatePath en server actions

- [x] `app/(dashboard)/articulos/actions.ts`: 5 paths
- [x] `app/(dashboard)/pedidos/actions.ts`: 4 paths
- [x] `app/(dashboard)/clientes/actions.ts`: 4 paths
- [x] `app/(dashboard)/informes/caja/actions.ts`: 2 paths

### T7: Actualizar imports de componentes

- [x] `components/articulos/ArticleList.tsx` → `@/app/(dashboard)/articulos/actions`
- [x] `components/articulos/ArticleForm.tsx` → `@/app/(dashboard)/articulos/actions`
- [x] `components/articulos/PurchaseModal.tsx` → `@/app/(dashboard)/articulos/actions`
- [x] `components/clientes/ClienteForm.tsx` → `@/app/(dashboard)/clientes/actions`
- [x] `components/clientes/AbonoForm.tsx` → `@/app/(dashboard)/clientes/actions`
- [x] `components/clientes/ClienteList.tsx` → `@/app/(dashboard)/clientes/actions`
- [x] `components/pedidos/PedidoForm.tsx` → `@/app/(dashboard)/pedidos/actions`
- [x] `components/pedidos/PedidoList.tsx` → `@/app/(dashboard)/pedidos/actions`
- [x] `components/pedidos/PedidoDetail.tsx` → `@/app/(dashboard)/pedidos/actions`
- [x] `components/informes/CajaForm.tsx` → `@/app/(dashboard)/informes/caja/actions`
- [x] `app/(dashboard)/clientes/[id]/page.tsx` → `@/app/(dashboard)/clientes/actions`
- [x] `app/(dashboard)/pedidos/[id]/page.tsx` → `@/app/(dashboard)/pedidos/actions`
- [x] `app/(dashboard)/pedidos/[id]/imprimir/page.tsx` → `@/app/(dashboard)/pedidos/actions`
- [x] `app/(dashboard)/articulos/[id]/historial/page.tsx` → `@/app/(dashboard)/articulos/actions`

### T8: Actualizar links en listas y detalles

- [x] `components/clientes/ClienteList.tsx`: 4 hrefs (`/dashboard/clientes/...` → `/clientes/...`)
- [x] `components/pedidos/PedidoForm.tsx`: 3 router.push (`/dashboard/pedidos/...` → `/pedidos/...`)
- [x] `components/pedidos/PedidoList.tsx`: 6 hrefs (`/dashboard/pedidos/...` → `/pedidos/...`)
- [x] `components/pedidos/PedidoDetail.tsx`: 1 href (`/dashboard/pedidos/...` → `/pedidos/...`)
- [x] `app/(dashboard)/pedidos/[id]/imprimir/page.tsx`: 2 hrefs
- [x] `app/(dashboard)/articulos/[id]/historial/page.tsx`: 1 href

### T9: Verificar con build

- [x] `npm run build` — Compilación exitosa ✅
- [x] No hay errores de import ni ruta

## Orden de ejecución

1. T1 (mover carpeta)
2. T2 (eliminar page.tsx raíz)
3. T3-T8 (actualizar referencias)
4. T9 (build + fix)
