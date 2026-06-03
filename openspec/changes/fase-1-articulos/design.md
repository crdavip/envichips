# Design: Fase 1 — Artículos

> Envichips SaaS · Diseño técnico
> Basado en Proposal + Specs + PRD v1.1

---

## 1. Arquitectura General

### 1.1 Diagrama de Rutas

```
┌─────────────────────────────────────────────────┐
│                 (dashboard) layout                │
│  ┌───────────────────────────────────────────┐   │
│  │          /dashboard/articulos              │   │
│  │  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │  ArticleList      │  │  Filters +    │  │   │
│  │  │  (client)         │  │  Search       │  │   │
│  │  │  ┌─ ArticleCard   │  │  (client)     │  │   │
│  │  │  │  (mobile)      │  └──────────────┘  │   │
│  │  │  ├─ ArticleRow    │                     │   │
│  │  │  │  (desktop)     │  ┌──────────────┐  │   │
│  │  │  └─ StockBadge    │  │  PurchaseModal│  │   │
│  │  └──────────────────┘  │  (client)     │  │   │
│  │                        └──────────────┘  │   │
│  ├─ /dashboard/articulos/[id]/historial ─────┤   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │  InventoryHistory (server)       │     │   │
│  │  │  ┌─ MovementTimeline            │     │   │
│  │  │  │  ├─ EntryBadge (green)       │     │   │
│  │  │  │  └─ ExitBadge (red)          │     │   │
│  │  └──────────────────────────────────┘     │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 1.2 Flujo de Datos

```
Browser (Client)                    Server
─────────────────                  ──────────────────
ArticleList (useState)
  │                                      │
  ├── filters/search (local state)       │
  ├── useEffect → debounce → filter      │
  │                                      │
  └── Server Action ──────────────────→ getArticulos()
         ←────── JSON ─────────────        │
         ←────── { data: Articulo[] }      └── Prisma findMany()
                                              └── filters WHERE
                                                  + orderBy
                                                  + include?

ArticleForm (useActionState)
  │                                      │
  ├── Zod validate (client)              │
  ├── show errors / loading              │
  └── Server Action ──────────────────→ createArticulo()
         ←────── { error?, data? } ────    │
                                           └── Zod validate (server)
                                           └── Prisma create()

PurchaseModal (useState multi-step)
  │                                      │
  ├── Step 1: select items + qty         │
  ├── Step 2: confirm totals + payment   │
  └── Server Action ──────────────────→ registerPurchase()
         ←────── redirect/refresh ────    │
                                           └── Zod validate
                                           └── prisma.$transaction()
                                                ├── Compra.create()
                                                ├── CompraItem.createMany()
                                                └── Articulo.updateMany()
                                                     (stockActual += cantidad)
```

---

## 2. Estructura de Archivos

```
app/(dashboard)/articulos/
├── page.tsx                    ← ArticleList page (server wrapper + client components)
├── actions.ts                  ← All server actions for this module
└── [id]/
    └── historial/
        └── page.tsx            ← Inventory history page (server component)

components/articulos/
├── ArticleList.tsx             ← Client component: grid/table, filters, search
├── ArticleCard.tsx             ← Mobile card view for an article
├── ArticleRow.tsx              ← Desktop table row for an article
├── ArticleForm.tsx             ← Create/edit form (reused via modal or page)
├── ArticleFilters.tsx          ← Category + presentation selects + search input
├── StockBadge.tsx              ← Reusable stock status badge
├── PurchaseModal.tsx           ← 2-step purchase wizard
├── PurchaseStepOne.tsx         ← Step 1: select articles + quantities
├── PurchaseStepTwo.tsx         ← Step 2: confirm totals, payment, notes
└── InventoryHistory.tsx        ← Timeline of movements for an article

lib/
├── services/
│   └── articulos.ts            ← Prisma service layer for articles
└── validations/
    └── articulos.ts            ← Zod schemas for articles module

types/
└── articulos.ts                ← TypeScript types (inferred from Zod outputs)
```

---

## 3. Component Tree

```
Page: /dashboard/articulos (server)
└── ArticleList (client)
    ├── Header (server) — título + botón "Nuevo Artículo"
    ├── ArticleFilters (client)
    │   ├── Select (categoría)
    │   ├── Select (presentación)
    │   └── Input (búsqueda por nombre, debounce 300ms)
    ├── ViewToggle (client) — grid/table switch (optional, auto por breakpoint)
    ├── GridView (mobile)
    │   └── ArticleCard[]
    │       ├── Nombre + Categoría + Presentación
    │       ├── Precio + Ganancia
    │       └── StockBadge
    ├── TableView (desktop)
    │   └── Table (shadcn)
    │       └── ArticleRow[]
    │           ├── Nombre, Categoría, Presentación, Costo, Precio, Ganancia, Stock, Badge
    │           └── Actions: Editar, Toggle Activo
    └── PurchaseModal (client)
        ├── Trigger: Botón "+ Compra"
        ├── PurchaseStepOne
        │   ├── SearchInput (debounce 300ms)
        │   ├── SelectedItems list
        │   └── Quantity inputs (number)
        └── PurchaseStepTwo
            ├── Items summary with subtotals
            ├── Total
            ├── MetodoPago select
            ├── Proveedor input
            ├── Observaciones textarea
            └── Confirm / Cancel buttons

Page: /dashboard/articulos/[id]/historial (server)
└── InventoryHistory (server)
    ├── ArticleHeader — nombre + stock actual
    └── Timeline
        └── MovementItem[]
            ├── Fecha
            ├── Tipo (Entrada/Salida) — colored badge
            ├── Cantidad
            ├── Referencia (Compra # / Pedido #)
            └── Responsable
```

---

## 4. Flujos Detallados

### 4.1 Flujo: Listado de Artículos

```
1. User navigates to /dashboard/articulos
2. Server renders shell, ArticleList client component mounts
3. ArticleList calls getArticulos() server action on mount
4. Server Action → Prisma findMany() → returns Articulo[]
5. ArticleList stores in local state (useState)
6. User filters by category → setState → re-render filtered list (client-side)
7. User searches by name → debounce 300ms → filter local state
8. User clicks "Editar" → open ArticleForm in edit mode
9. User clicks "+ Compra" → open PurchaseModal
10. StockBadge computed inline: stockActual vs stockMinimo
```

### 4.2 Flujo: Crear / Editar Artículo

```
1. User clicks "Nuevo Artículo" or "Editar" on existing
2. Show ArticleForm (modal on mobile, page/modal on desktop)
3. If editing: fetch article by ID, populate form
4. User fills fields:
   - nombre (required)
   - categoria (select, required)
   - presentacion (select, required)
   - costo (number, > 0)
   - precio (number, > costo)
   - stockMinimo (number, >= 0)
5. ganancia = precio - costo (auto-calculated, read-only)
6. Client-side Zod validation on submit
7. If client errors → show inline errors, no submit
8. Server Action called: createArticulo(data) or updateArticulo(id, data)
9. Server-side Zod validation
10. Prisma: create() or update()
11. If success → redirect to /dashboard/articulos
12. If error → return { error: "mensaje" }, form shows error
```

### 4.3 Flujo: Registrar Compra

```
1. User clicks "+ Compra" button in article list
2. PurchaseModal opens, Step 1 displayed
3. Step 1:
   a. Search for articles (debounce 300ms, local search on loaded articles)
   b. Select article → show quantity input
   c. Enter quantity → item added to selected list
   d. Can add multiple articles
   e. Each item shows subtotal (cantidad × precio)
   f. "Siguiente" button enabled when at least 1 item has quantity > 0
4. Step 2:
   a. Summary of all items with quantities and subtotals
   b. Total: sum of all subtotals
   c. Fecha: default hoy (editable date input)
   d. Proveedor: text input (required)
   e. MetodoPago: EFECTIVO / TRANSFERENCIA (radio or select)
   f. Observaciones: textarea (optional)
   g. "Confirmar" button → calls registerPurchase() server action
5. Server Action registerPurchase():
   a. Zod validate entire payload
   b. prisma.$transaction(async (tx) => {
        compra = await tx.compra.create({ data: ... })
        for each item:
          tx.compraItem.create({ data: { compraId, articuloId, cantidad, costo, subtotal } })
          tx.articulo.update({
            where: { id: articuloId },
            data: { stockActual: { increment: cantidad } }
          })
      })
   c. Return { data: compra }
6. On success: close modal, refresh article list (re-fetch getArticulos)
7. On error: show error in Step 2, stay in modal
```

### 4.4 Flujo: Historial de Inventario

```
1. User navigates to /dashboard/articulos/[id]/historial (from article actions)
2. Server component calls getHistorialArticulo(id) server action
3. Server Action:
   a. Fetch CompraItems for this article (entries)
   b. Fetch PedidoItems for this article where pedido.estado = ENTREGADO (exits)
   c. Combine both arrays, sort by fecha desc
   d. Each item: { fecha, tipo: "entrada"|"salida", cantidad, referencia, responsable }
4. Render timeline: entries with green indicators, exits with red
5. Show current stock at top
```

---

## 5. Estado y Manejo de Estado

| Componente | Estado | Tipo | Persistencia |
|-----------|--------|------|-------------|
| ArticleList | artículos[], filtros, búsqueda, loading | useState + useEffect | No (refetch on mount) |
| ArticleForm | form fields, errors, isSubmitting | useActionState (React 19) | No |
| PurchaseModal | step (1|2), selectedItems[], form fields | useState | No |
| InventoryHistory | movements[] (server) | Server Component | No |

No se necesita Zustand ni estado global para Fase 1. Todo es estado local de componentes.

---

## 6. Manejo de Errores

### 6.1 Forma consistente de Server Actions

```typescript
// Success
{ data: T }

// Error
{ error: string }
```

### 6.2 Validación Zod

- Client: validación en `onSubmit` del formulario, errores inline por campo
- Server: validación al inicio del Server Action, si falla retorna `{ error: "mensaje descriptivo" }`
- Schemas compartidos: `lib/validations/articulos.ts` importados en cliente y servidor

### 6.3 Errores de Prisma

- `Prisma.PrismaClientKnownRequestError`: capturar, loggear, retornar error genérico
- Errores de transacción: rollback automático (Prisma $transaction), retornar error

### 6.4 UI de errores

- Formularios: errores en badges rojos debajo de cada campo + toast para errores generales
- Listado: mensaje de error reemplaza la tabla si falla la carga inicial
- Modal: errores en la parte inferior con botón de reintento

---

## 7. Copias de Seguridad y Transacciones

### 7.1 Operaciones atómicas (Prisma $transaction)

Todas las operaciones que afectan stock MUST usar `prisma.$transaction`:

```typescript
// registerPurchase - atomic transaction
await prisma.$transaction(async (tx) => {
  const compra = await tx.compra.create({ data: compraData });
  
  for (const item of items) {
    await tx.compraItem.create({
      data: {
        compraId: compra.id,
        articuloId: item.articuloId,
        cantidad: item.cantidad,
        costo: item.costo,
        subtotal: item.cantidad * item.costo,
      },
    });
    
    await tx.articulo.update({
      where: { id: item.articuloId },
      data: { stockActual: { increment: item.cantidad } },
    });
  }
  
  return compra;
});
```

---

## 8. Decisiones Técnicas

| Decisión | Opción Elegida | Alternativa | Razón |
|----------|---------------|-------------|-------|
| Data fetching inicial | Server Action (no API Route) | API Route | Consistente con Fase 0, evita expor endpoints públicos |
| Filtros / búsqueda | Client-side con datos precargados | Server-side con query params | Suficiente para ~100 artículos, mejor UX, sin latencia |
| Form state | useActionState (React 19) | useFormState legacy | Es la API moderna de React 19 para form actions |
| Modal de compras | useState multi-step dentro del modal | React Router step URLs | La compra no necesita URL propia, es un sub-flujo |
| Grid/Table switch | Auto por breakpoint (CSS) | Toggle manual | Mobile-first, menos fricción, el usuario no necesita elegir |
| Historial | Query combinada con fetch separados | Vista materializada | No hay suficiente volumen para justificar una vista aparte |
| Stock update | `increment` en Prisma | read → modify → write | `increment` es atómico, evita race conditions de lectura |

---

## 9. Riesgos y Mitigaciones Técnicas

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Race condition en stock update | Stock incorrecto | Usar `increment` (atómico) dentro de `$transaction` |
| Modal de compras confuso en mobile | Baja adopción | Full-screen en mobile, validación paso a paso, resumen claro |
| Búsqueda lenta con >100 artículos | Mala UX en mobile | Client-side filter es O(n) sobre array en memoria, aceptable hasta ~500 items; si crece, migrar a server-side |
| Formulario pierde datos al recargar | Mala UX | useActionState preserva estado del form después de error del servidor |
