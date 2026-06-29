# SortControls Specification

## Purpose

Mobile sort controls for card-based list views. Renders a `SortBar`/`SortDropdown` above the card grid, allowing users to select sort field and direction without table headers.

## Requirements

### Requirement: Sort field selector

MUST render a dropdown or chip list of available sort fields with the current active field and direction indicator.

#### Scenario: Sort dropdown on mobile articles

- GIVEN articles displayed as cards on mobile (&lt;768px)
- WHEN user opens the sort dropdown
- THEN they see options: "Nombre", "Categoría", "Precio", "Stock", "Ganancia"
- AND the active sort field shows a direction arrow (↑ or ↓)

#### Scenario: Change sort field

- GIVEN mobile view sorted by "Nombre" ascending
- WHEN user selects "Precio" from the dropdown
- THEN the card grid re-orders by "Precio" ascending

### Requirement: Direction toggle

MUST allow toggling sort direction for the active field.

#### Scenario: Toggle direction

- GIVEN mobile view sorted by "Precio" ascending
- WHEN user taps the direction toggle button
- THEN sort changes to "Precio" descending

### Requirement: Responsive visibility

MUST be visible only on mobile breakpoints (below `lg` for CRUD lists, below `md` for report lists). On desktop, sort controls are on table headers only.

#### Scenario: Hidden on desktop

- GIVEN a viewport at or above the `lg` breakpoint
- THEN the SortBar MUST NOT render

#### Scenario: Visible on mobile

- GIVEN a viewport below `lg` breakpoint
- THEN the SortBar MUST render above the card grid

### Requirement: Sync with useSort hook

MUST accept `useSort` return values (`sortField`, `sortOrder`, `toggleSort`) as props and update reactively.

#### Scenario: Sort change propagates

- GIVEN SortBar connected to `useSort`
- WHEN user selects a new field
- THEN the list re-renders sorted by the new field
- AND the dropdown shows the updated active field
