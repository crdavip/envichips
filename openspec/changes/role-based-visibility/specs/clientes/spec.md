# Delta for Clientes

## MODIFIED Requirements

### Requirement: Permisos por rol

- SUPERADMIN y ADMIN: CRUD completo de clientes y registro de abonos
- DOMICILIARIO: SIN acceso a la página de clientes ni a ningún endpoint de mutación

(Previously: DOMICILIARIO tenía acceso de solo lectura)

#### Scenario: Admin ve listado de clientes

- GIVEN un usuario autenticado con rol ADMIN
- WHEN navega a `/clientes`
- THEN ve el listado completo con filtros y acciones CRUD

#### Scenario: Domiciliario no puede acceder a clientes

- GIVEN un usuario autenticado como DOMICILIARIO
- WHEN navega a `/clientes`
- THEN es redirigido a `/no-autorizado`

#### Scenario: Admin crea cliente exitosamente

- GIVEN un usuario ADMIN autenticado
- WHEN envía el formulario con datos válidos
- THEN el cliente se crea correctamente

#### Scenario: Domiciliario no puede crear cliente

- GIVEN un usuario DOMICILIARIO autenticado
- WHEN intenta crear/editar/eliminar cliente o registrar abono
- THEN MUST denegar con error "Acción no permitida para el rol actual"

## ADDED Requirements

### Server action guards

TODOS los server actions de clientes (`createCliente`, `updateCliente`, `deleteCliente`, `registrarAbono`) MUST llamar `requireRole("ADMIN", user)` antes de mutar.

#### Scenario: Admin actualiza cliente

- GIVEN usuario ADMIN autenticado
- WHEN llama `updateCliente` con datos válidos
- THEN los cambios persisten

#### Scenario: Domiciliario rechazado en servidor

- GIVEN usuario DOMICILIARIO autenticado
- WHEN llama cualquier server action de mutación de clientes
- THEN retorna error de autorización
