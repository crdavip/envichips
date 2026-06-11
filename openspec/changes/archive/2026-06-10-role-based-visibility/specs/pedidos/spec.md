# Delta for Pedidos

## MODIFIED Requirements

### Requirement: Crear pedido

El sistema MUST restringir la creación de pedidos: ADMIN y SUPERADMIN pueden crear pedidos completos. DOMICILIARIO NO MUST tener acceso al wizard de creación ni ver el FAB de "Nuevo pedido".
(Previously: sin restricción de rol para crear pedidos)

#### Scenario: Admin crea pedido exitosamente

- GIVEN usuario ADMIN autenticado
- WHEN navega a `/pedidos/create`
- THEN ve el wizard de 3 pasos completo
- AND puede crear el pedido

#### Scenario: Domiciliario no ve FAB

- GIVEN usuario DOMICILIARIO autenticado en listado de pedidos
- THEN NO ve botón FAB "Nuevo pedido"

#### Scenario: Domiciliario no accede a create

- GIVEN usuario DOMICILIARIO autenticado
- WHEN navega a `/pedidos/create`
- THEN es redirigido a `/pedidos`

### Requirement: Cancelar pedido

Solo ADMIN y SUPERADMIN pueden cancelar pedidos. DOMICILIARIO NO MUST ver ni acceder al botón de cancelar. (Previously: solo se mencionaba "solo admin" en transiciones, ahora se explicita el bloqueo a DOMICILIARIO)

#### Scenario: Admin cancela pedido con motivo

- GIVEN usuario ADMIN autenticado
- WHEN cancela pedido PENDIENTE con motivo válido
- THEN estado pasa a CANCELADO
- AND historial registra el cambio

#### Scenario: Domiciliario no ve botón cancelar

- GIVEN usuario DOMICILIARIO autenticado en detalle de pedido PENDIENTE
- THEN NO ve botón "Cancelar pedido"

## ADDED Requirements

### Server action guard en createPedidoAction

`createPedidoAction` MUST llamar `requireRole("ADMIN", user)` antes de procesar la creación.

#### Scenario: Admin crea pedido via server action

- GIVEN usuario ADMIN autenticado
- WHEN ejecuta `createPedidoAction`
- THEN pedido se crea correctamente

#### Scenario: Domiciliario rechazado en servidor

- GIVEN usuario DOMICILIARIO autenticado
- WHEN ejecuta `createPedidoAction`
- THEN retorna error de autorización
