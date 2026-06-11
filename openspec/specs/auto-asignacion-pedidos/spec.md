# Auto-Asignación de Pedidos

## Purpose

Permite que un DOMICILIARIO se auto-asigne pedidos PENDIENTE sin domiciliario asignado, complementando la asignación manual por Admin.

## Requirements

### Requirement: Tomar Pedido

DOMICILIARIO MUST poder auto-asignarse un pedido PENDIENTE sin `domiciliarioId`.

#### Scenario: Happy path — toma pedido disponible

- GIVEN pedido en estado `PENDIENTE` sin `domiciliarioId`
- WHEN DOMICILIARIO ejecuta `tomarPedidoAction(pedidoId)`
- THEN `domiciliarioId = user.id`
- AND se crea `HistorialEstado` con motivo "Domiciliario asignado por auto-asignación"

#### Scenario: Error — pedido ya asignado

- GIVEN pedido `PENDIENTE` con `domiciliarioId` asignado
- WHEN DOMICILIARIO intenta auto-asignarse
- THEN error: "El pedido ya tiene un domiciliario asignado"

#### Scenario: Error — estado incorrecto

- GIVEN pedido en estado distinto de `PENDIENTE`
- WHEN DOMICILIARIO intenta auto-asignarse
- THEN error: "Solo se pueden tomar pedidos en estado Pendiente"

#### Scenario: Error — rol incorrecto

- GIVEN pedido `PENDIENTE` sin domiciliario
- WHEN ADMIN ejecuta `tomarPedidoAction`
- THEN error de autorización

### Requirement: UI de Auto-Asignación

El sistema MUST mostrar botón "Tomar pedido" solo para DOMICILIARIO en pedidos disponibles.

#### Scenario: Botón visible en listado y detalle

- GIVEN DOMICILIARIO en listado de pedidos disponibles
- THEN cada pedido PENDIENTE sin domiciliario MUST mostrar botón "Tomar pedido"
- AND en detalle del pedido también MUST mostrar el botón

#### Scenario: Botón oculto para Admin

- GIVEN ADMIN en listado de pedidos
- THEN botón "Tomar pedido" NO MUST mostrarse

### Non-Functional

- **Atomicidad**: `tomarPedido` MUST ejecutarse en transacción Prisma (update pedido + create historial)
- **Concurrencia**: SHOULD usar `SELECT ... FOR UPDATE` o Prisma `update` con `where` que verifique `domiciliarioId = null` para evitar doble asignación
