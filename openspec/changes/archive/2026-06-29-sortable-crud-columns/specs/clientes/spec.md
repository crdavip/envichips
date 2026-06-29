# Delta for Clientes

## MODIFIED Requirements

### Requirement: Listar clientes

El sistema MUST listar clientes con filtros por nombre, teléfono, estado (AL_DIA/EN_DEUDA), y ordenamiento en TODAS las columnas de la tabla: nombreCompleto, teléfono, tipoDoc, estado (AL_DIA/EN_DEUDA), deuda, última visita. Columnas con posibles nulos (teléfono, última visita) MUST ordenar nulls al final. MUST mostrar columna "Última visita" con días transcurridos desde la última visita (o desde creadoEn) con badge rojo "N días sin visita" si ≥ 7 en clientes activos.
(Previously: ordenamiento genérico sin columnas especificadas)

#### Scenario: Sort by debt amount

- GIVEN a list of clients with varying debt amounts
- WHEN user clicks "Deuda" table header
- THEN clients sort by debt numeric value ascending
- AND clients with $0 debt appear first

#### Scenario: Sort by última visita with nulls-last

- GIVEN a list where some clients have no visits (`ultimaVisita: null`)
- WHEN user clicks "Última visita" header ascending
- THEN clients with visits sort by date ascending
- AND clients with null visits appear at the end

## ADDED Requirements

### Requirement: Mobile sort controls

ClienteList on mobile MUST render `<SortBar&gt;` above the card grid with columns: nombre, teléfono, estado, deuda.

#### Scenario: Mobile sort by debt

- GIVEN clients displayed as cards on mobile (&lt;lg breakpoint)
- WHEN user selects "Deuda" in SortBar
- THEN cards re-order by debt descending

### Requirement: Server action sort params

`getClientesAction(filtros?)` SHOULD accept optional `{ sortBy?: string, sortOrder?: "asc" | "desc" }` for future server-side migration.

#### Scenario: Payload available

- GIVEN the client list loaded
- WHEN `useSort` emits `sortPayload`
- THEN the payload is defined but not sent to the action
