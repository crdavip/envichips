# Delta for Pedidos

## MODIFIED Requirements

### Requirement: Listado de Pedidos — Sorting

MUST have ordenamiento seleccionable en TODAS las columnas: número de pedido, cliente, total, estado, domiciliario, fecha. Default remains fecha descendente. Sorting is client-side via `useSort&lt;Pedido&gt;`. The same sort state is shared across all 3 layout variants (admin, domiciliario-disponibles, domiciliario-mios).
(Previously: hardcoded fecha descendente only)

#### Scenario: Sort by total ascending

- GIVEN a list of pedidos loaded
- WHEN user clicks "Total" table header
- THEN pedidos sort by total ascending
- AND fecha default is overridden

#### Scenario: Sort by estado alphabetically

- GIVEN a list of pedidos
- WHEN user clicks "Estado" header
- THEN pedidos sort by state label: CANCELADO &lt; EN_CAMINO &lt; ENTREGADO &lt; PENDIENTE

#### Scenario: Sort state shared across tabs (domiciliario)

- GIVEN domiciliario view with "Disponibles" and "Mis pedidos" tabs
- WHEN user sorts by "Total" on the "Disponibles" tab
- THEN switching to "Mis pedidos" shows the same sort by "Total"
(Previously: no sort state across tabs)

### Requirement: Default sort remains fecha desc

On initial load, the list MUST still default to fecha descendente. The sort control MUST show "Fecha ↓" as the initial active sort.
(Previously: hardcoded behavior, not UI-controllable)

#### Scenario: Initial load default

- GIVEN user navigates to pedidos list
- THEN pedidos are ordered by fecha descending
- AND the table header "Fecha" shows a down arrow indicator

## ADDED Requirements

### Requirement: Mobile sort controls

PedidoList MUST render `<SortBar&gt;` above the card grid on mobile with columns: número, cliente, total, estado, fecha.

#### Scenario: Mobile sort by cliente

- GIVEN pedidos as cards on mobile
- WHEN user selects "Cliente" in SortBar
- THEN cards re-order by client name ascending

### Requirement: Server action sort params

`getPedidosAction(filtros?)` SHOULD accept optional `{ sortBy?: string, sortOrder?: "asc" | "desc" }`.

#### Scenario: Payload not sent

- GIVEN the pedidos list
- WHEN `useSort` emits sortPayload
- THEN the payload is defined but not sent (client-side only)
