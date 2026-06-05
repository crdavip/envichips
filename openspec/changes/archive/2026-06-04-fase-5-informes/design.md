# SDD Design: Fase 5 — Informes

> Cambio: `fase-5-informes`

---

## Enfoque Técnico

4 PRs stackeados contra main (~380 líneas c/u). Patrón por capas: `service → validation → actions → pages → components`. Toda query de reporte fluye: Server Component → Server Action → `lib/services/*.ts` → Prisma aggregate/groupBy → Response. Sin librería de charts externa — barras horizontales con Tailwind width.

## Decisiones de Arquitectura

| Decisión | Opciones | Elegida | Por qué |
|---|---|---|---|
| **Estructura de informes** | Un solo `lib/services/informes.ts` vs uno por reporte | **Archivo único** con secciones (getResumen, getVentas, etc.) | Cohesión: todas las queries de solo lectura en un lugar. ~200 líneas estimadas, manejable. Patrón del códigobase. |
| **Soft-delete en Movimiento** | (A) Crear-only sin schema migration vs (B) Agregar campos de soft-delete al modelo | **(B) Soft-delete** con migración Prisma mínima | El spec exige auditoría. Agrega `eliminado`, `eliminadoEn`, `eliminadoPorId`, `motivoEliminacion` al modelo Movimiento. Migración menor y aceptada. |
| **Total a cobrar** | N+1 con `getDeudaCliente()` vs query optimizada | **`Promise.all(getDeudaCliente)`** sobre clientes EN_DEUDA | < 100 clientes. Reusa lógica existente. Optimizar si hay problemas de performance. |
| **Filtro de fechas** | Client-side vs server-side | **Server-side** con `date-fns` en where de Prisma | Fechas calculadas en la action, pasadas como ISO strings. Coherente con el patrón existente. |
| **Gráficos** | recharts vs CSS bars vs nivo | **Div-based CSS bars** con Tailwind `w-[pct]%` | Sin dependencias. Suficiente para top 10 en v1. Agregar recharts si el cliente lo pide. |
| **Role gating** | Middleware vs server component vs client check | **Server component** con `session.user.rol` | Ganancias página entera. Check temprano, evita cargar datos para no autorizados. |
| **Acciones de caja** | En `informes/actions.ts` vs `caja/actions.ts` | **`caja/actions.ts`** separado | Acciones de mutación (CRUD) separadas de las de solo lectura. Cleaner. |

## Flujo de Datos

```
Browser ──GET──→ Server Component (page.tsx)
                  │
                  ├─ Server Action (actions.ts)
                  │    └─ lib/services/informes.ts
                  │         └─ Prisma (aggregate/groupBy/findMany)
                  │              └─ PostgreSQL
                  │
                  └─ Client Component (tables, cards, filters)
                       └─ Props desde Server Component
```

Para Caja: el flujo incluye `lib/services/movimientos.ts` entre la action y Prisma. Las mutaciones (`createMovimientoAction`) usan `revalidatePath` tras éxito.

## Archivos Afectados

| Archivo | Acción | PR | Descripción |
|---|---|---|---|
| `lib/services/movimientos.ts` | Crear | PR1 | CRUD + queries para Movimiento |
| `lib/validations/movimientos.ts` | Crear | PR1 | Zod schemas: createMovimientoSchema, deleteMovimientoSchema |
| `app/dashboard/informes/caja/actions.ts` | Crear | PR1 | Server actions: createMovimientoAction, deleteMovimientoAction |
| `prisma/schema.prisma` | Modificar | PR1 | Agregar soft-delete fields a Movimiento |
| `lib/services/informes.ts` | Crear | PR2 | Queries agregadas: getResumenDelDia, getVentas, getInventario, getGanancias, getDomiciliarios |
| `app/dashboard/page.tsx` | Modificar | PR2 | Reemplazar cards estáticas con Suspense + queries reales |
| `app/dashboard/informes/page.tsx` | Crear | PR2 | Resumen del día + navegación a sub-reportes |
| `app/dashboard/informes/ventas/page.tsx` | Crear | PR3 | Ventas report server page |
| `app/dashboard/informes/inventario/page.tsx` | Crear | PR3 | Inventario report server page |
| `components/informes/VentasTable.tsx` | Crear | PR3 | Tabla cliente con barras CSS para top 10 |
| `components/informes/InventarioTable.tsx` | Crear | PR3 | Tabla cliente con badges de stock y alertas |
| `app/dashboard/informes/caja/page.tsx` | Crear | PR4 | Caja report + resumen (flujo neto, saldo) |
| `app/dashboard/informes/ganancias/page.tsx` | Crear | PR4 | Ganancias con role gate SUPERADMIN |
| `app/dashboard/informes/domiciliarios/page.tsx` | Crear | PR4 | Domiciliarios report |
| `components/informes/CajaTable.tsx` | Crear | PR4 | Lista de movimientos con filtros |
| `components/informes/CajaForm.tsx` | Crear | PR4 | Dialog para crear movimiento |
| `components/informes/GananciasCards.tsx` | Crear | PR4 | Cards resumen de ganancias |
| `components/informes/DomiciliariosTable.tsx` | Crear | PR4 | Tabla de rendimiento por domiciliario |

## Estrategia de Testing

No hay test runner configurado. Verificación vía:
- `tsc` (type check) — el strict mode de TS captura errores de tipos
- `npm run build` (build check) — verifica que todo compila
- Verificación manual navegando los reportes en el browser con datos reales

## Preguntas Abiertas

- [ ] **Date range picker**: usar inputs nativos `<input type="date">` o agregar shadcn CalendarPopover? Nativo es más simple para v1, CalendarPopover tiene mejor UX.
- [ ] **Paginación en Caja**: 20 por página vs scroll infinito vs sin paginación (lista completa)? El spec sugiere paginación. Implementar con offset/page params.
