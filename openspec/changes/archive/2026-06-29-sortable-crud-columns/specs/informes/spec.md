# Delta for Informes

## MODIFIED Requirements

### Requirement: Informe de Ventas — Columnas ordenables

VentasTable MUST permitir ordenamiento en TODAS las columnas: producto, unidades vendidas, ingresos, ganancia, % del total. The current hardcoded sort by unidades descendentes becomes the default but is overridable.
(Previously: hardcoded sort by unidades vendidas descending only)

#### Scenario: Sort by profit

- GIVEN the VentasTable loaded
- WHEN user clicks "Ganancia" header
- THEN rows sort by profit descending

#### Scenario: Sort by name

- GIVEN VentasTable with product names
- WHEN user clicks "Producto" header ascending
- THEN rows sort alphabetically by product name

### Requirement: Informe de Inventario — Columnas ordenables

InventarioTable MUST soportar ordenamiento en TODAS las columnas: producto, ingresos, egresos, stock actual, stock mínimo, estado, valor inventario. Previously SHOULD allowed "any column"; now MUST with explicit list.
(Previously: SHOULD allow sort by any column — now MUST with all specified)

#### Scenario: Sort by stock actual

- GIVEN InventarioTable loaded
- WHEN user clicks "Stock Actual" header
- THEN rows sort by stock count ascending

### Requirement: Informe de Domiciliarios — Columnas ordenables

DomiciliariosTable MUST soportar ordenamiento en TODAS las columnas: domiciliario, pedidos entregados, total vendido, efectivo recolectado, transferencias, pedidos cancelados.
(Previously: hardcoded sort by pedidos entregados descending)

#### Scenario: Sort by total vendido

- GIVEN DomiciliariosTable loaded
- WHEN user clicks "Total Vendido" header
- THEN rows sort by total sold descending

## ADDED Requirements

### Requirement: CajaTable — Full sorting

CajaTable MUST soportar ordenamiento en TODAS sus columnas (detalle aún no especificado en spec base). Sorting MUST apply BEFORE pagination slicing. Uses `useSort&lt;CajaRow&gt;`.
(Reason: CajaTable not documented in base spec but exists in codebase and is listed in scope)

#### Scenario: Sort before pagination

- GIVEN CajaTable with 50 rows and page size 20
- WHEN user sorts by a column
- THEN the full dataset is sorted first, then paginated to show page 1

#### Scenario: Date sort with ISO parsing

- GIVEN CajaTable with ISO date strings
- WHEN sorting by date column
- THEN dates are parsed via `new Date(v).getTime()` before comparison

### Requirement: Mobile sort controls

All report tables (VentasTable, InventarioTable, DomiciliariosTable, CajaTable) MUST render `<SortBar&gt;` above the card grid on mobile (below `md` breakpoint for reports).

#### Scenario: Mobile sort on VentasTable

- GIVEN VentasTable displayed on mobile (&lt;md)
- WHEN user selects "Unidades" in SortBar
- THEN card grid re-orders by units descending

### Requirement: Server action sort params

All report server actions (`getVentasAction`, `getInventarioAction`, `getDomiciliariosAction`) SHOULD accept optional `{ sortBy?: string, sortOrder?: "asc" | "desc" }`.

#### Scenario: Payload emitted

- GIVEN any report table loaded
- WHEN sort changes
- THEN the optional payload is defined but not sent
