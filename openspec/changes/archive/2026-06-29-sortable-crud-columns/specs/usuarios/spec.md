# Delta for Usuarios

## MODIFIED Requirements

### Requirement: RF-01: Listar Usuarios — Sorting

El SUPERADMIN DEBE poder ver una tabla con todos los usuarios del sistema. La tabla DEBE ordenarse por cualquier columna seleccionable: nombre, email, rol, estado (Activo/Inactivo), teléfono, último acceso, fecha de creación. Columnas con nulos (teléfono, último acceso) MUST ordenar nulls al final. Default remains fecha de creación descendente.
(Previously: hardcoded fecha de creación descendente only)

#### Scenario: Sort by rol

- GIVEN the usuarios table loaded
- WHEN user clicks "Rol" header
- THEN users sort by role alphabetically: ADMIN &lt; DOMICILIARIO &lt; SUPERADMIN

#### Scenario: Sort by estado

- GIVEN the usuarios table
- WHEN user clicks "Estado" header
- THEN active users sort before inactive (or vice versa for desc)

#### Scenario: Null teléfono sorts last

- GIVEN users with some null phone numbers
- WHEN sorting by "Teléfono" ascending
- THEN null entries appear at the end

#### Scenario: Default sort on load

- GIVEN user navigates to usuarios
- THEN the table is sorted by fecha de creación descending by default

## ADDED Requirements

### Requirement: Mobile sort controls

UsuariosTable MUST render `<SortBar&gt;` above the card grid on mobile with columns: nombre, email, rol, estado, teléfono.

#### Scenario: Mobile sort by email

- GIVEN users displayed as cards on mobile
- WHEN user selects "Email" in SortBar
- THEN cards re-order by email ascending

### Requirement: Server action sort params

The server action (getUsuarios/filter) SHOULD accept optional `{ sortBy?: string, sortOrder?: "asc" | "desc" }` for future server-side migration.

#### Scenario: Payload defined

- GIVEN the usuarios list component
- WHEN `useSort` provides sortPayload
- THEN the payload is defined but not sent to the server action
