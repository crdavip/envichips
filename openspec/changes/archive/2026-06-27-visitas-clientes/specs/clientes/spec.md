# Delta for Clientes

## MODIFIED Requirements

### Requirement: Listar clientes

El sistema MUST listar clientes con filtros por nombre, teléfono, estado (AL_DIA/EN_DEUDA), ordenamiento, y MUST mostrar columna "Última visita" con días transcurridos desde la última visita (o desde creadoEn) con badge rojo "N días sin visita" si ≥ 7 en clientes activos.
(Previously: Listado sin columna de última visita ni alerta de inactividad)

#### Scenario: Listado con filtros

- GIVEN que existen 5 clientes activos y 2 inactivos
- WHEN se filtra por estado AL_DIA
- THEN MUST mostrar solo los clientes con estado AL_DIA

#### Scenario: Cliente con deuda alta visible

- GIVEN un cliente con deuda > $0
- WHEN se renderiza en la lista
- THEN MUST mostrar el estado EN_DEUDA con badge rojo y el monto de deuda

#### Scenario: Badge de 7+ días sin visita

- GIVEN un cliente activo sin visitas desde hace 9 días
- WHEN se renderiza en la lista
- THEN MUST mostrar badge rojo "9 días sin visita"

#### Scenario: Sin badge si dentro del umbral

- GIVEN un cliente activo visitado hace 3 días
- WHEN se renderiza en la lista
- THEN NO MUST mostrar badge de alerta

## ADDED Requirements

### Requirement: Botón "Registrar visita" en UI de clientes

El sistema MUST mostrar botón "Registrar visita" por cada cliente en el listado y en el detalle, visible solo para SUPERADMIN y ADMIN. Al hacer clic, MUST abrir un modal con campo notas opcional.

#### Scenario: Admin registra visita desde listado

- GIVEN un usuario ADMIN en el listado de clientes
- WHEN hace clic en "Registrar visita", ingresa "Cliente satisfecho" y confirma
- THEN MUST crear RegistroVisita con fecha actual, userId del admin, notas "Cliente satisfecho"
- AND MUST refrescar la columna "Última visita"

#### Scenario: Domiciliario no ve botón

- GIVEN un usuario DOMICILIARIO en el listado
- THEN NO MUST ver el botón "Registrar visita"

### Requirement: Server action registrarVisitaAction

El sistema MUST exponer un server action `registrarVisitaAction(clienteId, notas?)` protegido con `requireRole("ADMIN", user)`, que cree un RegistroVisita en BD y revalide la ruta de clientes.

#### Scenario: Creación exitosa con revalidación

- GIVEN un ADMIN autenticado con clienteId válido
- WHEN llama registrarVisitaAction
- THEN MUST retornar { data: RegistroVisita }
- AND MUST revalidarPath("/dashboard/clientes")

#### Scenario: Rol no autorizado

- GIVEN un DOMICILIARIO autenticado
- WHEN llama registrarVisitaAction
- THEN MUST retornar { error: "No autorizado" }
