# Estado de Cobro

## Purpose

Estado de cobro explícito con awareness del método de pago. Reemplaza `dineroCobrado` (boolean) con enum `EstadoCobro` y adapta el flujo de entrega según `metodoPago`.

## Schema

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `estadoCobro` | `EstadoCobro` | `PENDIENTE` | Estado actual del cobro |
| `dineroCobrado` | Boolean | — | Deprecado (mantener 1 ciclo para rollback) |
| `pagoEntregadoAdmin` | Boolean | `false` | Admin confirmó recepción física |
| `pagoEntregadoEn` | DateTime? | `null` | Timestamp de confirmación admin |

## Requirements

### Requirement: EstadoCobro Enum

El enum `EstadoCobro` MUST tener valores `PENDIENTE`, `COBRADO_PARCIAL`, `COBRADO`.

### Requirement: Entrega Payment-Method-Aware

#### Scenario: EFECTIVO — preguntar cobro

- GIVEN pedido `EN_CAMINO` con `metodoPago = EFECTIVO`
- WHEN DOMICILIARIO marca ENTREGADO
- THEN modal MUST preguntar si cobró efectivo y monto
- AND si confirma: `estadoCobro = COBRADO`
- AND si no: `estadoCobro = PENDIENTE`

#### Scenario: FIADO — no preguntar cobro

- GIVEN pedido `EN_CAMINO` con `metodoPago = FIADO`
- WHEN DOMICILIARIO marca ENTREGADO
- THEN modal NO MUST preguntar por cobro
- AND `estadoCobro = PENDIENTE`

#### Scenario: TRANSFERENCIA — opcional

- GIVEN pedido `EN_CAMINO` con `metodoPago = TRANSFERENCIA`
- WHEN DOMICILIARIO marca ENTREGADO
- THEN modal SHOULD preguntar si transferencia fue realizada
- AND si confirma: `estadoCobro = COBRADO`
- AND si no: `estadoCobro = COBRADO_PARCIAL`

### Requirement: Admin Confirma Cobro

#### Scenario: COBRADO_PARCIAL → COBRADO

- GIVEN pedido ENTREGADO con `estadoCobro = COBRADO_PARCIAL`
- WHEN ADMIN ejecuta `confirmarCobroAdminAction(id)`
- THEN `estadoCobro = COBRADO`, `pagoEntregadoAdmin = true`, `pagoEntregadoEn = now()`
- AND se crea `HistorialEstado`

#### Scenario: Doble confirmación bloqueada

- GIVEN pedido con `estadoCobro = COBRADO`
- WHEN ADMIN intenta confirmar
- THEN error: "El cobro ya fue confirmado"

### Requirement: Badges de Cobro

#### Scenario: Badge según estado

- GIVEN `estadoCobro = PENDIENTE` → badge "Pendiente de cobro"
- GIVEN `estadoCobro = COBRADO_PARCIAL` → badge "Cobro parcial"
- GIVEN `estadoCobro = COBRADO` → badge "Cobrado"

### Migration

`dineroCobrado` → `EstadoCobro`: si dineroCobrado=true AND pagoEntregadoAdmin=true → COBRADO; si dineroCobrado=true AND pagoEntregadoAdmin=false → COBRADO_PARCIAL; else PENDIENTE. Mantener campos viejos 1 ciclo para rollback.
