# Delta for Articulos

## MODIFIED Requirements

### Requirement: Catálogo de Artículos — Sorting

The list view MUST have sorting on ALL columns: nombre, categoría, presentación, costo, precio, ganancia, stock, and estado. `ganancia` uses an accessor function (`precio - costo`). `estado` sorts alphabetically by stock status label. Sorting is client-side via `useSort&lt;Articulo&gt;`.
(Previously: sorting on 3 columns — nombre, precio, stock)

#### Scenario: Sort by category

- GIVEN the full article list loaded
- WHEN user clicks "Categoría" table header
- THEN articles sort alphabetically by category name ascending
- WHEN clicked again → descending

#### Scenario: Sort by computed profit

- GIVEN the full article list loaded
- WHEN user clicks "Ganancia" table header
- THEN articles sort by `precio - costo` (computed) ascending
- AND the accessor function is used, not a stored field

#### Scenario: Sort by stock status badge

- GIVEN the full article list loaded
- WHEN user clicks "Estado" table header
- THEN articles sort by badge label: "Sin Stock" &lt; "Stock Bajo" &lt; "Stock OK"
(Previously: estado was not sortable)

## ADDED Requirements

### Requirement: Server action sort params

`getArticulos(filtros?)` SHOULD accept optional `{ sortBy?: string, sortOrder?: "asc" | "desc" }` parameters for future server-side migration.

#### Scenario: Params passed but ignored client-side

- GIVEN the article list component
- WHEN `useSort` provides `sortPayload`
- THEN the payload is available but NOT sent to the action yet (client-side sort only)

### Requirement: Mobile sort controls

ArticleList on mobile MUST render `<SortBar&gt;` above the card grid with all sortable columns. Desktop uses table header clicks exclusively.
(Previously: no sort controls on mobile)

#### Scenario: Mobile sort by category

- GIVEN articles displayed as cards on mobile (&lt;lg breakpoint)
- WHEN user selects "Categoría" in the SortBar dropdown
- THEN cards re-order by category ascending
