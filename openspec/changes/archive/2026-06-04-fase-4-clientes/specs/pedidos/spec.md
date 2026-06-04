# Delta for Pedidos

## MODIFIED Requirements

### Requirement: Si `metodoPago = FIADO`, MUST mostrar la deuda actual del cliente como advertencia

Si `metodoPago = FIADO`, MUST mostrar la deuda actual del cliente como advertencia calculada en tiempo real mediante agregación (pedidos FIADO - abonos) utilizando el servicio de clientes.
(Previously: Mostraba la deuda actual del cliente accediendo directamente al campo `cliente.deuda`)

#### Scenario: FIADO con advertencia (deuda media)

- GIVEN que estoy en el paso 3 del wizard de crear pedido
- AND que he seleccionado un cliente con deuda actual de $75.000
- AND que he seleccionado `metodoPago = FIADO`
- WHEN se renderiza la sección de método de pago
- THEN MUST mostrar una advertencia con el texto "Deuda actual: $75.000" en fondo amarillo
- AND la advertencia MUST ser visible pero no bloqueante para continuar con el pedido

#### Scenario: FIADO con advertencia (deuda alta)

- GIVEN que estoy en el paso 3 del wizard de crear pedido
- AND que he seleccionado un cliente con deuda actual de $150.000
- AND que he seleccionado `metodoPago = FIADO`
- WHEN se renderiza la sección de método de pago
- THEN MUST mostrar una advertencia con el texto "Deuda actual: $150.000" en fondo rojo
- AND la advertencia MUST ser visible pero no bloqueante para continuar con el pedido

#### Scenario: FIADO sin deuda (deuda baja)

- GIVEN que estoy en el paso 3 del wizard de crear pedido
- AND que he seleccionado un cliente con deuda actual de $0
- AND que he seleccionado `metodoPago = FIADO`
- WHEN se renderiza la sección de método de pago
- THEN NO debe mostrar ninguna advertencia de deuda
- OR en su lugar, MUST mostrar el mensaje "Sin deuda" en fondo verde

#### Scenario: Venta rápida con FIADO

- GIVEN que estoy en el paso 3 del wizard de crear pedido
- AND que he seleccionado la opción "Venta rápida" (sin cliente asociado)
- AND que he seleccionado `metodoPago = FIADO`
- WHEN se renderiza la sección de método de pago
- THEN NO debe mostrar ninguna advertencia de deuda
- AND MUST permitir continuar con la creación del pedido normalmente

#### Scenario: Actualización en tiempo real al cambiar cliente

- GIVEN que estoy en el paso 1 del wizard de crear pedido
- AND que he seleccionado inicialmente un cliente con deuda de $50.000
- AND que estoy en el paso 3 y he seleccionado `metodoPago = FIADO`
- WHEN cambio el cliente en el paso 1 a uno con deuda de $120.000
- THEN la advertencia de deuda en el paso 3 MUST actualizarse automáticamente
- AND mostrar "Deuda actual: $120.000" en fondo amarillo sin necesidad de recargar la página

### Requirement: Si `metodoPago = FIADO`, MUST incrementar lógica de deuda al crear pedidos FIADO

Si `metodoPago = FIADO` al crear un pedido, MUST utilizar el servicio de clientes para registrar el pedido de manera que la deuda se calcule dinámicamente mediante agregación (pedidos FIADO - abonos) en lugar de modificar directamente un campo `cliente.deuda`.
(Previously: Incrementaba directamente `cliente.deuda += total` al crear pedidos FIADO)

#### Scenario: Crear pedido FIADO actualiza cálculo de deuda

- GIVEN que existe un cliente con 1 pedido FIADO de $50.000 y 0 abonos
- AND que la deuda actual del cliente es $50.000 (calculada como 50000 - 0)
- WHEN creo un nuevo pedido FIADO para ese cliente por $30.000
- THEN el pedido debe crearse exitosamente
- AND al consultar la deuda actual del cliente, debe retornar $80.000 (calculada como 80000 - 0)
- AND NO debe existir un campo `cliente.deuda` que haya sido incrementado directamente

#### Scenario: Crear pedido FIADO con abono anterior

- GIVEN que existe un cliente con 1 pedido FIADO de $100.000 y 1 abono de $40.000
- AND que la deuda actual del cliente es $60.000 (calculada como 100000 - 40000)
- WHEN creo un nuevo pedido FIADO para ese cliente por $25.000
- THEN el pedido debe crearse exitosamente
- AND al consultar la deuda actual del cliente, debe retornar $85.000 (calculada como 125000 - 40000)
- AND el campo `cliente.deuda` NO debe existir o no debe haber sido modificado directamente

#### Scenario: Pedido FIADO CANCELADO no afecta deuda

- GIVEN que existe un cliente con 1 pedido FIADO de $50.000 y 0 abonos
- AND que la deuda actual del cliente es $50.000
- WHEN creo un pedido FIADO por $30.000 y luego lo cancelo
- THEN el pedido cancelado NO debe contribuir al cálculo de deuda
- AND al consultar la deuda actual del cliente, debe seguir siendo $50.000
- AND solo los pedidos FIADO con estados PENDIENTE, EN_CAMINO o ENTREGADO deben contar en el cálculo

## ADDED Requirements

### Requirement: Sistema debe usar servicio de clientes para cálculo de deuda en pedidos

El sistema de pedidos MUST delegar el cálculo de deuda al servicio de clientes en lugar de mantener lógica de cálculo duplicada.
Esto asegura consistencia entre módulos y permite reutilizar la misma lógica de cálculo en todo el sistema.

#### Scenario: Consistencia en cálculo de deuda entre módulos

- GIVEN que existe un cliente con cierta cantidad de pedidos FIADO y abonos
- WHEN consulto la deuda del cliente desde el módulo de pedidos
- AND cuando consulto la deuda del cliente desde el módulo de clientes
- THEN ambos retornos deben ser idénticos
- AND debe utilizar la misma función subyacente de cálculo de deuda