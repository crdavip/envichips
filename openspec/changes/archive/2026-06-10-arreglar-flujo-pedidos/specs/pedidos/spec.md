# Delta for Pedidos

## MODIFIED Requirements

### Requirement: Crear Pedido — siempre PENDIENTE

Toda orden nueva MUST crearse en estado `PENDIENTE`, independientemente de si tiene `domiciliarioId` o no.
(Previously: sin domiciliario → ENTREGADO, con domiciliario → PENDIENTE)

#### Scenario: Venta directa sin domiciliario

- GIVEN Admin creando pedido sin seleccionar domiciliario
- WHEN confirma creación
- THEN pedido creado en `PENDIENTE`, no en ENTREGADO
- AND queda disponible para auto-asignación por DOMICILIARIO

### Requirement: EstadoCobro en Ciclo de Cobro

El ciclo de cobro MUST usar `EstadoCobro` en lugar de `dineroCobrado` boolean.
(Previously: dineroCobrado boolean + montoCobrado)

#### Scenario: Admin confirma cobro con HistorialEstado

- GIVEN pedido ENTREGADO con `estadoCobro = COBRADO_PARCIAL`
- WHEN ADMIN confirma cobro
- THEN se crea `HistorialEstado` con `estadoAntes`, `estadoDespues`, `cambiadoPorId`
- AND `estadoCobro = COBRADO`

### Requirement: Gestión de Estados — role-aware + stock validation

DOMICILIARIO MUST poder transicionar PENDIENTE→EN_CAMINO y EN_CAMINO→ENTREGADO en sus pedidos asignados. ADMIN/SUPERADMIN mantienen acceso completo.
(Previously: solo ADMIN/SUPERADMIN podían transicionar)

#### Scenario: DOMICILIARIO marca EN_CAMINO

- GIVEN DOMICILIARIO autenticado con pedido asignado en PENDIENTE
- WHEN ejecuta `updateEstadoAction(id, { estado: "EN_CAMINO" })`
- THEN pedido pasa a EN_CAMINO, historial creado

#### Scenario: DOMICILIARIO marca ENTREGADO

- GIVEN DOMICILIARIO con pedido asignado en EN_CAMINO
- WHEN ejecuta `updateEstadoAction` con estado ENTREGADO
- THEN pedido pasa a ENTREGADO, stock se descuenta, historial creado

#### Scenario: DOMICILIARIO no puede saltar estados

- GIVEN DOMICILIARIO con pedido en PENDIENTE
- WHEN intenta pasar directamente a ENTREGADO
- THEN error: transición no permitida

#### Scenario: Stock validation antes de ENTREGADO

- GIVEN pedido EN_CAMINO con item de 5 unidades y stockActual=2
- WHEN DOMICILIARIO o ADMIN marca ENTREGADO
- THEN error: "Stock insuficiente para [artículo]: disponible 2, requerido 5"
- AND estado NO cambia

#### Scenario: Admin puede PENDIENTE→ENTREGADO (venta directa)

- GIVEN Admin con pedido PENDIENTE sin domiciliario
- WHEN ejecuta `updateEstadoAction` con estado ENTREGADO
- THEN transición permitida, stock descontado, historial creado

### Requirement: Listado DOMICILIARIO — disponibles + activos

DOMICILIARIO MUST ver dos secciones: "Pedidos disponibles" (PENDIENTE sin domiciliario) y "Mis pedidos activos" (propios: EN_CAMINO + ENTREGADO hoy).
(Previously: solo veía sus pedidos del día)

#### Scenario: DOMICILIARIO ve pedidos disponibles

- GIVEN DOMICILIARIO en listado de pedidos
- THEN ve sección "Pedidos disponibles" con PENDIENTE sin domiciliario
- AND sección "Mis pedidos activos" con sus EN_CAMINO y ENTREGADO hoy

#### Scenario: Sin pedidos disponibles

- GIVEN DOMICILIARIO en listado y no hay PENDIENTE sin domiciliario
- THEN sección "Pedidos disponibles" MUST mostrar "No hay pedidos disponibles"

## ADDED Requirements

### Requirement: PENDIENTE→ENTREGADO (Admin direct sale)

ADMIN/SUPERADMIN MUST poder transicionar PENDIENTE→ENTREGADO (venta directa sin domiciliario). NO permitido para DOMICILIARIO.

#### Scenario: Admin entrega directa

- GIVEN pedido PENDIENTE sin domiciliario
- WHEN ADMIN marca ENTREGADO
- THEN transición permitida, stock validado y descontado, historial creado

### Requirement: tomarPedidoAction

DOMICILIARIO puede auto-asignarse pedidos PENDIENTE sin domiciliario mediante `tomarPedidoAction`. (Requirement completo en `openspec/specs/auto-asignacion-pedidos/spec.md`)

## REMOVED Requirements

### Requirement: Venta directa → ENTREGADO automático

(Reason: toda orden nueva debe empezar como PENDIENTE para permitir auto-asignación)
(Migration: createPedido ya no crea ENTREGADO; Admin usa transición PENDIENTE→ENTREGADO para venta directa)
