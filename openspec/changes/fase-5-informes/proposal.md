# Propuesta: Fase 5 — Informes

## Intención

Reemplazar el dashboard estático (cards con $0) con datos reales agregados, y construir el módulo completo de informes operativos (ventas, inventario, caja, ganancias, domiciliarios) para que los dueños de Envichips tomen decisiones en tiempo real sin depender de Excel.

## Alcance

### Incluye

- Servicio de consultas agregadas (`lib/services/informes.ts`) con queries de solo lectura para todos los reportes
- Servicio CRUD para Movimiento de caja (`lib/services/movimientos.ts`) + validaciones Zod
- Server actions unificadas para informes y movimientos
- Dashboard principal (`app/dashboard/page.tsx`) consumiendo datos reales
- Página de resumen del día (`/dashboard/informes`) con cards de métricas clave
- Sub-páginas deep-linkeables para Ventas, Inventario, Caja, Ganancias, Domiciliarios
- Componentes cliente reutilizables en `components/informes/` (tablas, barras CSS, filtros)
- Role gate para Ganancias (SuperAdmin únicamente)
- Navegación entre reportes vía layout existente de dashboard

### Excluye

- Chart library externa (v1 usa barras horizontales con CSS puro)
- Auto-generación de movimientos de caja desde Pedido/Compra (solo manual)
- Históricos con filtros de rango de fechas (v1 usa hoy/semana/mes fijo)
- Exportación a PDF o Excel
- Dashboard ejecutivo con gráficos de tendencia
- Migraciones de esquema Prisma (se usa modelo Movimiento existente sin cambios)

## Capacidades

### Nuevas Capacidades

- `informes`: Consultas agregadas para resumen del día, ventas, inventario, ganancias, rendimiento de domiciliarios
- `movimientos-caja`: CRUD de movimientos de caja (ingreso/egreso), cálculo de flujo neto y saldo actual

### Capacidades Modificadas

- `dashboard`: La página principal (`/dashboard`) reemplaza cards estáticas con datos reales desde los servicios de informes

## Enfoque Técnico

Cuatro PRs stackeados contra main, cada uno ~380 líneas, siguiendo el patrón establecido (service → validation → actions → pages → components):

1. **PR 1 — Infraestructura base + CRUD Movimiento**: `lib/services/movimientos.ts`, `lib/validations/movimientos.ts`, `app/dashboard/informes/actions.ts`. Sin páginas aún. Prepara el terreno para caja.

2. **PR 2 — Dashboard real + Resumen del día**: `lib/services/informes.ts` (queries agregadas: ventas hoy, pendientes, stock bajo, deudores, total a cobrar). Modifica `app/dashboard/page.tsx` para consumir datos reales. Crea `app/dashboard/informes/page.tsx` como resumen del día con navegación a sub-reportes.

3. **PR 3 — Ventas + Inventario**: Sub-páginas `/dashboard/informes/ventas` y `/dashboard/informes/inventario`. Componentes `VentasTable.tsx`, `InventarioTable.tsx` con groupBy de Prisma y barras CSS para top productos.

4. **PR 4 — Caja + Ganancias + Domiciliarios**: Sub-páginas restantes. Caja consume servicio Movimiento. Ganancias con role gate SuperAdmin. Domiciliarios con groupBy por usuario. Barras CSS para top domiciliarios.

### Decisiones técnicas

- Sin librería de charts v1 — barras horizontales con CSS (div con `width: porce%` y colores Tailwind)
- `date-fns` para `startOfDay`, `endOfDay`, `subDays`, `format`
- `formatCOP()` existente en `lib/format.ts` para moneda
- Queries de solo lectura en `informes.ts` — sin mutaciones
- `getDeudaCliente()` reusado del módulo clientes para total a cobrar
- Role gate con `session.user.rol === "SUPERADMIN"` en server components
- Movimiento manual v1 — `registradoPorId` sin FK, se consulta User aparte

## Archivos Afectados

| Archivo | Impacto | Descripción |
|---------|---------|-------------|
| `lib/services/movimientos.ts` | Nuevo | CRUD completo + queries para Movimiento (PR1) |
| `lib/validations/movimientos.ts` | Nuevo | Schemas Zod para crear/editar Movimiento (PR1) |
| `app/dashboard/informes/actions.ts` | Nuevo | Server actions: crear/editar/eliminar Movimiento, queries de informes (PR1) |
| `lib/services/informes.ts` | Nuevo | Servicio de consultas agregadas de solo lectura (PR2) |
| `app/dashboard/page.tsx` | Modificado | Reemplazar cards estáticas con suspense y data real (PR2) |
| `app/dashboard/informes/page.tsx` | Nuevo | Resumen del día con métricas clave + navegación (PR2) |
| `app/dashboard/informes/ventas/page.tsx` | Nuevo | Informe de ventas con groupBy producto (PR3) |
| `app/dashboard/informes/inventario/page.tsx` | Nuevo | Stock actual, valor inventario, ingresos/egresos (PR3) |
| `app/dashboard/informes/caja/page.tsx` | Nuevo | Listado movimientos, flujo neto, saldo actual (PR4) |
| `app/dashboard/informes/ganancias/page.tsx` | Nuevo | Ganancias netas, role gate SuperAdmin (PR4) |
| `app/dashboard/informes/domiciliarios/page.tsx` | Nuevo | Rendimiento por domiciliario, conteo y totales (PR4) |
| `components/informes/VentasTable.tsx` | Nuevo | Tabla de ventas con barras CSS (PR3) |
| `components/informes/InventarioTable.tsx` | Nuevo | Tabla de inventario con alertas de stock bajo (PR3) |
| `components/informes/CajaTable.tsx` | Nuevo | Listado de movimientos con Badge de tipo (PR4) |
| `components/informes/CajaForm.tsx` | Nuevo | Formulario para crear/editar movimiento (PR4) |
| `components/informes/GananciasCards.tsx` | Nuevo | Cards resumen de ganancias (PR4) |
| `components/informes/DomiciliariosTable.tsx` | Nuevo | Tabla de rendimiento por domiciliario (PR4) |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Budget de 400 líneas ajustado para PR1 | Media | Movimiento es simple, sin relaciones FK ni páginas. Si excede, dividir actions en archivo separado. |
| Deuda calculation N+1 en total a cobrar | Media | Usar `cliente.findMany` con `select: { ... }` y `where: { estado: EN_DEUDA }` en una query, luego sumar con `getDeudaCliente()` en paralelo con `Promise.all`. |
| `Movimiento.registradoPorId` sin FK | Baja | Consultar User aparte con `findUnique`. Aceptable para v1. Agregar relación en schema futuro si es necesario. |
| Ganancia sin costo en pedidos anteriores al snapshot | Baja | `PedidoItem.ganancia` se snapshotea desde ahora. Pedidos anteriores pueden tener ganancia = 0. Documentado como limitación v1. |
| Sin chart library para top 10 | Baja | Barras CSS como fallback v1. Agregar recharts en fase posterior si el cliente lo solicita. |

## Plan de Rollback

Cada PR es independiente y apunta a main. Rollback por PR:

| PR | Rollback |
|----|----------|
| PR1 | Eliminar `lib/services/movimientos.ts`, `lib/validations/movimientos.ts`, `app/dashboard/informes/actions.ts`. |
| PR2 | Revertir `app/dashboard/page.tsx` a cards estáticas. Eliminar `lib/services/informes.ts` y `app/dashboard/informes/page.tsx`. |
| PR3 | Eliminar `app/dashboard/informes/ventas/`, `app/dashboard/informes/inventario/`, `components/informes/VentasTable.tsx`, `components/informes/InventarioTable.tsx`. |
| PR4 | Eliminar `app/dashboard/informes/caja/`, `app/dashboard/informes/ganancias/`, `app/dashboard/informes/domiciliarios/`, componentes asociados. |

Si se revierte todo, el nav link a `/dashboard/informes` puede quedar huérfano — requiere limpieza manual en `nav-links.tsx` si es necesario.

## Dependencias

- Prisma schema con modelo `Movimiento`, `TipoMovimiento`, `CategoriaMovimiento` existentes
- `date-fns` v4.4.0 instalado
- `formatCOP()` en `lib/format.ts`
- `getDeudaCliente()` en módulo clientes existente
- Autenticación NextAuth.js v5 con `session.user.rol`
- Componentes shadcn/ui: Card, Table, Badge, Skeleton, Select, Dialog, Input, Button, Label

## Criterios de Éxito

- [ ] Dashboard principal muestra datos reales (ventas hoy, pedidos pendientes, stock bajo, clientes en deuda)
- [ ] Resumen del día en `/dashboard/informes` consolida métricas clave de todos los reportes
- [ ] Ventas: listado de productos vendidos hoy con cantidades y totales, ordenado por volumen
- [ ] Inventario: stock actual, valor total, alertas de stock bajo, ingresos/egresos del día
- [ ] Caja: CRUD completo de movimientos, flujo neto calculado, saldo actual visible
- [ ] Ganancias: cálculo bruto - costos, visible solo para SuperAdmin
- [ ] Domiciliarios: ranking por pedidos entregados y total facturado hoy
- [ ] Cada PR es revisable individualmente con <400 líneas de diff
- [ ] Sin regresiones en dashboard existente ni en módulos de pedidos/clientes/artículos
