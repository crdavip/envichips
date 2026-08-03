# Proposal: Mejora Gestión de Artículos

## Intent

Mejorar la experiencia de gestión del catálogo de artículos en tres frentes: (1) edición parcial — enviar solo campos modificados en vez del formulario completo, (2) ajuste manual de stock — input directo de `stockActual` en el formulario de edición, (3) filtros mejorados — drawer mobile-first con filtros avanzados y chips removibles.

Módulo PRD: **Artículos**.

## Scope

### In Scope
- Dirty-field tracking en `ArticleForm` para enviar solo campos modificados
- Input de `stockActual` en modo edición con nota de "ajuste manual"
- Refine condicional `precio > costo` en `updateArticuloSchema` (solo cuando ambos campos están presentes)
- Filter drawer mobile-first con: búsqueda, categoría, presentación, activo/inactivo, stock status, rango de precios
- Active filters como chips removibles con botón "Limpiar filtros"

### Out of Scope
- Auditoría de ajustes manuales de stock (no se registran en historial de compras/pedidos)
- Migración de filtrado a server-side (el catálogo es pequeño, client-side basta)
- Cambios en `PurchaseModal` o `registerPurchase`
- Cambios en el historial de inventario por artículo
- Nuevos modelos, server actions, o cambios de schema Prisma

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `articulos`: El formulario de edición soporta dirty-field tracking (payload parcial), input de `stockActual` en modo edición, y refine condicional `precio > costo`. El listado de artículos tiene un filter drawer mobile-first con filtros avanzados (activo/inactivo, stock status, rango de precios) y chips de filtros activos removibles.

## Approach

### 1. Edición parcial
- `ArticleForm`: capturar snapshot inicial de campos, comparar con valores actuales al submit, construir payload solo con campos dirty.
- `updateArticuloSchema`: agregar `.refine()` condicional que valida `precio > costo` solo cuando ambos campos están en el payload.
- El backend ya soporta `.partial()` — sin cambios en services ni actions.

### 2. Stock manual
- Agregar input `stockActual` en `ArticleForm` visible solo en modo edición.
- Mostrar nota: "Ajuste manual — no se registra en historial".
- Se envía como parte del payload parcial (dirty field).

### 3. Filtros mejorados
- Reemplazar la barra horizontal de 3 filtros por un layout con búsqueda + categoría siempre visibles, y botón "Filtros" que abre un Dialog (shadcn) con el resto.
- Dentro del Dialog: select presentación, select activo/inactivo, select stock status (Sin Stock / Bajo / OK), inputs precio mín/máx.
- Filtros activos se muestran como chips removibles debajo de la barra principal.
- Todo el filtrado permanece client-side (datos ya precargados).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/articulos/ArticleForm.tsx` | Modified | Dirty-field tracking, input stockActual, conditional validation |
| `lib/validations/articulos.ts` | Modified | Refine condicional precio > costo en updateArticuloSchema |
| `components/articulos/ArticleFilters.tsx` | Modified | Filter drawer, nuevos estados de filtro, active filter chips |
| `components/articulos/ArticleList.tsx` | Modified | Wire nuevos filtros (activo, stockStatus, precioMin/Max) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistencia en historial de inventario tras ajuste manual | Medium | Nota visible en el UI; documentar como limitación conocida |
| Validate precio > costo con solo un campo dirty | Low | Refine condicional: solo ejecuta cuando ambos campos están en payload |
| Filter drawer rompe accesibilidad de selects existentes | Low | Usar Dialog de shadcn (ya probado en proyecto) |
| 400-line budget excedido | Low | 3 cambios acotados en 4 archivos; estimación ~250 líneas |

## Rollback Plan

Revertir los 4 archivos afectados. No hay cambios de schema ni de API — rollback es un `git revert` limpio sin migraciones ni datos que restaurar.

## Dependencies

- Ninguna. Todo se construye sobre código existente.

## Success Criteria

- [ ] Al editar un artículo, solo los campos modificados se envían al servidor
- [ ] `precio > costo` se valida solo cuando ambos campos están en el payload
- [ ] `stockActual` es editable en el formulario de edición
- [ ] Nota de "ajuste manual" visible junto al input de stock
- [ ] Filter drawer abre en mobile y muestra todos los filtros avanzados
- [ ] Filtros activos se muestran como chips removibles con opción "Limpiar filtros"
- [ ] Búsqueda y categoría permanecen siempre visibles fuera del drawer
- [ ] Todos los filtros operan client-side sin latencia perceptible
