# Specs: Asignación de Domiciliario

> Envichips SaaS · Especificaciones detalladas
> Nueva capability — Módulo: Pedidos

---

## Purpose

Permitir que un Admin/SuperAdmin asigne o cambie el domiciliario de un pedido existente después de su creación, manteniendo un registro de auditoría en el historial de estados.

## Requirements

### Requirement: Asignar Domiciliario a Pedido

El sistema MUST permitir asignar un domiciliario a un pedido que no tenga uno.

#### Scenario: Asignar domiciliario a pedido sin asignar

- GIVEN Un pedido en estado `PENDIENTE` o `EN_CAMINO` sin domiciliario asignado
- WHEN Un Admin selecciona un domiciliario y confirma la asignación
- THEN El pedido queda con el domiciliario asignado
- AND Se crea un registro en `HistorialEstado` con motivo "Domiciliario asignado: [nombre]"
- AND El estado del pedido no cambia

### Requirement: Cambiar Domiciliario de Pedido

El sistema MUST permitir cambiar el domiciliario de un pedido que ya tenga uno asignado.

#### Scenario: Cambiar domiciliario en pedido existente

- GIVEN Un pedido en estado `PENDIENTE` o `EN_CAMINO` con domiciliario asignado
- WHEN Un Admin selecciona otro domiciliario y confirma el cambio
- THEN El pedido queda con el nuevo domiciliario
- AND Se crea un registro en `HistorialEstado` con motivo "Domiciliario cambiado: [anterior] → [nuevo]"
- AND El estado del pedido no cambia

### Requirement: Validar Estados Permitidos

El sistema NO MUST permitir asignar/cambiar domiciliario si el pedido está en estados terminales.

#### Scenario: Bloquear cambio en pedido ENTREGADO

- GIVEN Un pedido en estado `ENTREGADO` o `CANCELADO`
- WHEN Un Admin intenta cambiar el domiciliario
- THEN El sistema MUST rechazar la operación con un error "No se puede cambiar el domiciliario de un pedido [estado]"

### Requirement: UI de Asignación

El sistema MUST proveer una interfaz visible solo para Admin/SuperAdmin en el detalle del pedido.

#### Scenario: Modal de selección de domiciliario

- GIVEN Un Admin visualizando el detalle de un pedido en estado `PENDIENTE` o `EN_CAMINO`
- WHEN El Admin hace clic en "Cambiar domiciliario"
- THEN Se abre un modal con un selector de domiciliarios activos
- AND El domiciliario actual (si existe) aparece preseleccionado
- AND La opción "Sin domiciliario" está disponible para desasignar

#### Scenario: Domiciliario no disponible para ENTREGADO/CANCELADO

- GIVEN Un Admin visualizando el detalle de un pedido en estado `ENTREGADO` o `CANCELADO`
- THEN El botón "Cambiar domiciliario" NO MUST mostrarse
- AND El domiciliario se muestra como información de solo lectura

### Non-Functional Requirements

- **Rendimiento**: La operación de asignación debe completarse en < 500ms
- **Atomicidad**: La asignación y el registro en `HistorialEstado` MUST hacerse en una transacción de Prisma
- **Permisos**: Solo Admin/SuperAdmin pueden asignar/cambiar domiciliarios
- **Auditoría**: Cada cambio queda registrado en `HistorialEstado` con quién lo hizo y cuándo
