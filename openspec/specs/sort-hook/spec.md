# useSort&lt;T&gt; Hook Specification

## Purpose

Generic client-side sorting hook for CRUD and report list views. Accepts a data array and field configuration; returns sorted data, toggle handlers, and a server-action-compatible payload for future server-side migration.

## Requirements

### Requirement: Sort field configuration

The hook MUST accept a configuration object defining sortable fields with `type` (`string | number | date`), an optional `accessor` function for computed fields, and a nulls-last policy.

#### Scenario: String field sort

- GIVEN an array of articles with `nombre` field
- WHEN `useSort` is configured with `{ key: "nombre", type: "string" }` and user toggles sort
- THEN the array is sorted alphabetically A-Z (ascending) or Z-A (descending)

#### Scenario: Number field sort

- GIVEN an array of articles with `precio` field
- WHEN `useSort` is configured with `{ key: "precio", type: "number" }` and user toggles sort
- THEN the array is sorted numerically ascending or descending

#### Scenario: Date field sort from ISO string

- GIVEN an array of pedidos with `fecha` as ISO string
- WHEN `useSort` is configured with `{ key: "fecha", type: "date" }` and user toggles sort
- THEN dates are parsed via `new Date(v).getTime()` and sorted chronologically

### Requirement: Computed field accessor

The hook MUST accept an `accessor` function for fields that don't exist directly on the data object.

#### Scenario: Computed profit sort

- GIVEN articles where `ganancia` is computed as `precio - costo`
- WHEN configured with `{ key: "ganancia", type: "number", accessor: (a) => a.precio - a.costo }`
- THEN sorting uses the accessor result for comparison

#### Scenario: Nested property accessor

- GIVEN data with `articulo.nombre` for display sorting
- WHEN configured with accessor `(d) => d.articulo.nombre`
- THEN sort compares the nested value correctly

### Requirement: Nulls-last policy

MUST sort null/undefined values to the end regardless of sort direction.

#### Scenario: Null phone sorts last asc

- GIVEN clientes where some have `telefono: null`
- WHEN sorting by `telefono` ascending
- THEN null entries appear at the end

#### Scenario: Null phone sorts last desc

- GIVEN clientes where some have `telefono: null`
- WHEN sorting by `telefono` descending
- THEN null entries still appear at the end

### Requirement: Sort payload for server actions

The hook MUST expose `{ sortBy: string, sortOrder: "asc" | "desc" }` for future server-side sorting.

#### Scenario: Payload on column toggle

- GIVEN a sorted list
- WHEN user toggles to `precio` descending
- THEN `sortPayload` equals `{ sortBy: "precio", sortOrder: "desc" }`

### Requirement: Toggle cycle

MUST cycle through: none → asc → desc per column. Clicking a different column resets to asc.

#### Scenario: Three-click cycle

- GIVEN data sorted by `nombre` ascending
- WHEN user clicks `nombre` header again → sort changes to descending
- WHEN user clicks `nombre` header again → sort resets to none (insertion order)

#### Scenario: Column switch resets

- GIVEN data sorted by `nombre` ascending
- WHEN user clicks `precio` header
- THEN sort changes to `precio` ascending
