# Design: Mejora Gestión de Artículos

## Technical Approach

Cambio 100% client-side sobre 4 archivos existentes. El backend ya soporta payloads parciales (`updateArticuloSchema.partial()` y `updateArticulo` con spreads condicionales) — el trabajo es: (1) construir el payload de edición solo con campos dirty usando `initialData` como snapshot, (2) exponer `stockActual` en modo edición, (3) reemplazar la barra de filtros por búsqueda + botón "Filtros" con drawer, filtros avanzados y chips removibles. Sin dependencias nuevas: se reutilizan `Dialog`, `Badge`, `Select`, `Input` ya presentes en el proyecto.

## Architecture Decisions

### Decision: Snapshot y tracking de dirty fields

| Opción | Tradeoff | Decisión |
|---|---|---|
| Comparar estado controlado vs `initialData` al submit | `initialData` ya ES el snapshot; cero estado extra | ✅ |
| `useRef` con clon del snapshot | Redundante: la prop ya es estable durante la vida del dialog | ❌ |
| Librería de formularios (RHF) | Nueva dependencia + reescritura del form | ❌ fuera de scope |

El estado se mantiene como `useState` por campo (patrón actual) + `useActionState`. El payload se construye **desde el estado** (no desde FormData), lo que permite eliminar los hidden inputs de sincronización de selects. En edición, solo se incluye cada campo si `state[field] !== initialData[field]` (extiende el helper `isDirty` ya existente pero hoy sin uso). Si no hay campos dirty, no se llama al server action: se invoca `onSuccess()` directamente y el dialog cierra (evita un UPDATE vacío).

### Decision: Refine condicional `precio > costo`

```ts
export const updateArticuloSchema = articuloBaseSchema
  .extend({ stockActual: z.number().int().min(0, "...").optional() })
  .partial()
  .refine(
    (d) => d.precio === undefined || d.costo === undefined || d.precio > d.costo,
    { message: "El precio debe ser mayor al costo", path: ["precio"] },
  );
```

Se ejecuta SOLO cuando ambos campos están presentes. `createArticuloSchema` conserva su refine obligatorio intacto. El mismo schema valida en cliente (form) y servidor (action) — defensa en profundidad sin código duplicado.

### Decision: Drawer = `Dialog` existente con overrides responsive

| Opción | Tradeoff | Decisión |
|---|---|---|
| Reusar `Dialog` + `className` responsive en `DialogContent` | Cero deps/archivos nuevos; patrón ya probado en el proyecto | ✅ |
| Crear componente Drawer/Sheet propio | Más código y tests para un solo uso | ❌ |
| Popover inline | Selects anidados dentro de popover rompen portal/foco | ❌ |

El root del `Dialog` centra con flex; el content controla su eje vertical vía `self-*` sin tocar `dialog.tsx`. Mobile: bottom-sheet (`self-end w-full max-w-none rounded-t-2xl max-h-[80vh]`). Desktop (`sm:`): panel centrado (`sm:self-center sm:max-w-md sm:rounded-2xl`). Accesibilidad: `DialogContent` acepta `HTMLAttributes` y los propaga, así que se pasan `role="dialog"`, `aria-modal="true"` y `aria-label="Filtros"` desde el call-site. Botón "Filtros" con `aria-label` que incluye el conteo ("Filtros, 2 activos"); cada chip tiene botón con `aria-label="Quitar filtro {label}"`.

### Decision: Ubicación de categoría (conflicto proposal vs spec)

El proposal pedía categoría siempre visible; el spec (autoridad de requisitos) la ubica DENTRO del drawer, dejando solo búsqueda + botón "Filtros" visibles. Se sigue el **spec**: mobile-first real (3 elementos no caben en 360px) y la categoría activa se sigue viendo como chip. Registrado en Open Questions.

## Data Flow

Edición parcial:

    ArticleForm state ──submit──▶ diff vs initialData ──▶ payload parcial
         │                                                          │
         │◀── fieldErrors ── updateArticuloSchema (refine condicional)
         ▼
    updateArticuloAction(id, payload) ──▶ updateArticulo (spreads condicionales)

Filtros:

    ArticleFilters (drawer) ──onChange──▶ ArticleList.filtros
                                               │ filter() client-side
                                               ▼
                                     filtered → useSort → ArticleCard / ArticleRow

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/articulos/ArticleForm.tsx` | Modify | Payload dirty-only desde estado; input `stockActual` (edit-only) + nota; eliminar hidden inputs |
| `lib/validations/articulos.ts` | Modify | Refine condicional en `updateArticuloSchema` (+5 líneas) |
| `components/articulos/ArticleFilters.tsx` | Modify | Layout búsqueda + botón con badge; drawer; chips; estado extendido |
| `components/articulos/ArticleList.tsx` | Modify | Predicados `activo`/`stockStatus`/rango precios; helper `getStockStatus` reutilizado en sort accessor |
| `lib/validations/articulos.test.ts` | Create | RED: refine condicional (4 escenarios del spec) |
| `components/articulos/ArticleForm.test.tsx` | Create | RED: payload parcial, stock edit-only, stock `-5` inválido, submit sin cambios no llama action |
| `components/articulos/ArticleFilters.test.tsx` | Create | RED: drawer abre, chip remove, badge count, "Limpiar todo" |
| `components/articulos/ArticleList.test.tsx` | Create | RED: predicados activo / stockStatus / precioMin-Max |

Estimación producción: ~180 líneas en 4 archivos (presupuesto 400 — riesgo bajo).

## Interfaces / Contracts

```ts
// ArticleFilters.tsx
export type StockStatus = "sin-stock" | "bajo" | "ok";

export interface ArticleFiltersState {
  categoria?: Categoria;
  presentacion?: Presentacion;
  q?: string;
  activo?: boolean;        // undefined = todos
  stockStatus?: StockStatus;
  precioMin?: number;      // COP enteros
  precioMax?: number;
}
```

```ts
// ArticleList.tsx (module-private, también usado por el sort accessor "estado")
function getStockStatus(a: Articulo): StockStatus {
  if (a.stockActual === 0) return "sin-stock";
  if (a.stockActual < a.stockMinimo) return "bajo";
  return "ok";
}
```

Chips (Badge + botón X de lucide): categoría/presentación → valor; activo → "Activos"/"Inactivos"; stockStatus → "Sin Stock"/"Stock Bajo"/"Stock OK"; precios → "Desde $X" / "Hasta $X". El badge del botón cuenta solo filtros del drawer (`q` excluido: ya visible en su input). "Limpiar todo" → `onChange({})` + reset del search input local.

Input `stockActual`: `type="number" min={0} step={1}`, renderizado solo si `mode === "edit"`, ubicado tras "Stock Mínimo", con nota visible: "Ajuste manual — no se registra en el historial de compras/pedidos". Viaja como dirty field; validado por el `int().min(0)` ya existente en el schema.

## Testing Strategy

Strict TDD: RED primero (cada escenario Given/When/Then del spec → test), luego implementación.

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Refine condicional (4 GWT del spec) | vitest puro sobre schemas |
| Integration | ArticleForm: payload `{precio}` solo, `costo` no viaja, creación exige completo, stock edit-only, `-5` inválido, nota visible | RTL + `vi.mock` de actions, `useActionState` real |
| Integration | ArticleFilters: drawer abre, chip elimina filtro, badge "2", limpiar reinicia | RTL, queries por role/label |
| Integration | ArticleList: sin stock / bajo / ok, rango precios, activo | RTL con `getArticulosAction` mockeado |
| E2E | N/A | No disponible en el proyecto |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Cambio puramente UI + validación client-side.

## Migration / Rollout

No migration required. Sin cambios de schema Prisma ni de API. Rollback = `git revert` de 4 archivos.

## Open Questions

- [ ] Conflicto proposal vs spec sobre categoría siempre visible: el diseño sigue el spec (categoría dentro del drawer). Confirmar con el usuario antes de apply; si prefiere el proposal, la categoría sale del drawer a la barra principal (cambio menor de layout).
- [ ] El `Dialog` actual no cierra con Escape ni tiene focus-trap. Se mantiene como está (patrón del proyecto, mismo comportamiento que los dialogs de ArticleForm/PurchaseModal); limitación conocida documentada, no regresión.
