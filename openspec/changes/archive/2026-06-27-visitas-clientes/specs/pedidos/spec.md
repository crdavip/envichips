# Delta for Pedidos

## ADDED Requirements

### Requirement: Visita automática al entregar pedido

Dentro de `actualizarEstado()` en el servicio de pedidos, al transicionar a estado ENTREGADO, el sistema MUST crear un RegistroVisita en la misma transacción atómica. El registro MUST contener: clienteId del pedido, userId del usuario que ejecuta la transición, fecha actual, y notas = null.

#### Scenario: Auto-visita en ENTREGADO exitoso

- GIVEN un pedido PENDIENTE con clienteId válido y stock suficiente
- WHEN un ADMIN ejecuta actualizarEstado con estado=ENTREGADO y la transición completa es exitosa
- THEN MUST crear RegistroVisita con clienteId, userId, fecha actual, notas=null
- AND el pedido MUST quedar en estado ENTREGADO

#### Scenario: Sin visita si no es ENTREGADO

- GIVEN un pedido PENDIENTE
- WHEN se transiciona a CANCELADO o EN_CAMINO
- THEN NO MUST crear RegistroVisita

#### Scenario: Atomicidad — fallo en visita revierte estado

- GIVEN un pedido con datos válidos para ENTREGADO
- WHEN la inserción del RegistroVisita falla (ej: FK constraint)
- THEN MUST revertir toda la transacción Prisma
- AND el pedido MUST permanecer en su estado anterior (PENDIENTE o EN_CAMINO)
