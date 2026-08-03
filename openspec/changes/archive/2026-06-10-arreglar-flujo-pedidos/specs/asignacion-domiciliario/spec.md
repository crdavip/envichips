# Delta for Asignación de Domiciliario

## MODIFIED Requirements

### Requirement: Asignar Domiciliario — ampliado con auto-asignación

El sistema MUST soportar dos mecanismos de asignación: (1) Admin asigna domiciliario manualmente, (2) DOMICILIARIO se auto-asigna.
(Previously: solo Admin podía asignar)

#### Scenario: Admin asigna manualmente (sin cambios)

- GIVEN pedido PENDIENTE o EN_CAMINO sin domiciliario
- WHEN Admin selecciona domiciliario y confirma
- THEN pedido asignado, HistorialEstado creado (comportamiento existente)

#### Scenario: DOMICILIARIO auto-asigna

- GIVEN pedido PENDIENTE sin domiciliario
- WHEN DOMICILIARIO ejecuta `tomarPedidoAction`
- THEN pedido asignado, HistorialEstado creado con motivo "Domiciliario asignado por auto-asignación"

### Requirement: Validar Estados Permitidos — ampliado

Auto-asignación SOLO permitida en estado `PENDIENTE`. Admin puede asignar en `PENDIENTE` o `EN_CAMINO`.
(Previously: Admin podía en PENDIENTE o EN_CAMINO)

#### Scenario: DOMICILIARIO no puede auto-asignar EN_CAMINO

- GIVEN pedido EN_CAMINO sin domiciliario
- WHEN DOMICILIARIO intenta auto-asignarse
- THEN error: "Solo se pueden tomar pedidos en estado Pendiente"
- WHEN Admin asigna manualmente el mismo pedido
- THEN asignación exitosa

## ADDED Requirements

### Requirement: Concurrencia en Auto-Asignación

El sistema MUST prevenir doble asignación cuando dos DOMICILIARIOS intentan tomar el mismo pedido simultáneamente.

#### Scenario: Race condition — segundo toma falla

- GIVEN dos DOMICILIARIOS intentan tomar el mismo pedido PENDIENTE simultáneamente
- WHEN ambos ejecutan `tomarPedidoAction`
- THEN solo el primero MUST asignarse exitosamente
- AND el segundo MUST recibir error "El pedido ya fue asignado a otro domiciliario"

## REMOVED Requirements

Ninguno removido. Comportamiento existente de asignación Admin se mantiene intacto.
