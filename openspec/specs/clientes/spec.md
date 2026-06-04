# Clientes Specification

## Purpose

Gestión completa de clientes, cartera (deuda FIADO), y registro de abonos para Envichips SaaS.

## Requirements

### CRUD de Clientes

#### Requirement: Crear cliente

El sistema MUST permitir crear un cliente con los campos: nombreCompleto (requerido), telefono, direccion, tipoDoc, numeroDoc, limiteCredito.

##### Scenario: Creación exitosa

- GIVEN un usuario autenticado con rol SUPERADMIN o ADMIN
- WHEN envía el formulario con nombreCompleto válido y datos opcionales
- THEN el cliente se crea con estado AL_DIA y deuda $0
- AND se asigna un idCliente auto-generado con formato CLI-{year}-{counter}
- AND se redirige al listado de clientes

##### Scenario: Creación sin nombre

- GIVEN un usuario autenticado
- WHEN envía el formulario con nombreCompleto vacío
- THEN MUST mostrar error de validación: "El nombre es requerido"
- AND NO debe crear el cliente

#### Requirement: Listar clientes

El sistema MUST listar clientes con filtros por nombre, teléfono, estado (AL_DIA/EN_DEUDA), y ordenamiento.

##### Scenario: Listado con filtros

- GIVEN que existen 5 clientes activos y 2 inactivos
- WHEN se filtra por estado AL_DIA
- THEN MUST mostrar solo los clientes con estado AL_DIA

##### Scenario: Cliente con deuda alta visible

- GIVEN un cliente con deuda > $0
- WHEN se renderiza en la lista
- THEN MUST mostrar el estado EN_DEUDA con badge rojo y el monto de deuda

#### Requirement: Actualizar cliente

El sistema MUST permitir editar campos de un cliente existente.

##### Scenario: Edición exitosa

- GIVEN un cliente existente
- WHEN se modifican campos válidos
- THEN los cambios MUST persistir en la base de datos
- AND se redirige al detalle del cliente

#### Requirement: Eliminar cliente

El sistema MAY permitir desactivar (soft-delete) un cliente. NO se elimina físicamente.

##### Scenario: Desactivar cliente

- GIVEN un cliente activo sin pedidos pendientes
- WHEN se desactiva
- THEN el campo activo MUST pasar a false
- AND el cliente NO aparece en listados por defecto

### Abonos

#### Requirement: Registrar abono

El sistema MUST permitir registrar un abono a un cliente con monto, metodoPago, y notas opcionales.

##### Scenario: Registro exitoso

- GIVEN un cliente con deuda actual de $100.000
- WHEN se registra un abono de $40.000 en EFECTIVO
- THEN el abono MUST quedar registrado en la tabla Abono
- AND la deuda calculada MUST ser $60.000
- AND el estado MUST actualizarse: si deuda > 0 → EN_DEUDA, si deuda = 0 → AL_DIA

##### Scenario: Abono con monto inválido

- GIVEN un formulario de abono
- WHEN se ingresa monto <= 0
- THEN MUST mostrar error "El monto debe ser mayor a 0"
- AND NO debe registrarse el abono

#### Requirement: Historial de abonos

El sistema MUST mostrar el historial de abonos de un cliente en orden cronológico descendente.

##### Scenario: Ver historial

- GIVEN un cliente con 3 abonos registrados
- WHEN se accede al detalle del cliente
- THEN MUST mostrar los 3 abonos con fecha, monto, método de pago, y notas

### Deuda en Tiempo Real

#### Requirement: Cálculo de deuda

La deuda MUST calcularse en tiempo real como: SUM(total de pedidos con metodoPago=FIADO y estado≠CANCELADO) - SUM(monto de abonos).

##### Scenario: Cálculo correcto

- GIVEN un cliente con 2 pedidos FIADO ($50.000 + $30.000) y 1 abono ($20.000)
- WHEN se consulta la deuda
- THEN MUST retornar $60.000 (80000 - 20000)

##### Scenario: Pedido cancelado excluido

- GIVEN un cliente con 1 pedido FIADO ($50.000) y 1 pedido FIADO cancelado ($30.000)
- WHEN se consulta la deuda
- THEN MUST retornar $50.000 (el cancelado no cuenta)

#### Requirement: Alerta de deuda en pedidos FIADO

Al seleccionar metodoPago=FIADO en creación de pedido, MUST mostrar advertencia de deuda actual del cliente.

##### Scenario: Deuda media

- GIVEN cliente con deuda $75.000 y método FIADO seleccionado
- THEN MUST mostrar advertencia "Deuda actual: $75.000" en fondo amarillo

##### Scenario: Sin deuda

- GIVEN cliente con deuda $0 y método FIADO seleccionado
- THEN MUST mostrar indicador verde "Sin deuda"

#### Requirement: Límite de crédito

El sistema MUST validar que (deuda actual + total del pedido) <= limiteCredito antes de crear un pedido FIADO.

##### Scenario: Límite excedido

- GIVEN cliente con limiteCredito=$100.000, deuda=$80.000, y pedido=$30.000
- WHEN se intenta crear pedido FIADO
- THEN MUST rechazar con error "Límite de crédito excedido"
- AND NO debe crearse el pedido

### Control de Acceso

#### Requirement: Permisos por rol

- SUPERADMIN y ADMIN: CRUD completo de clientes y registro de abonos
- DOMICILIARIO: solo lectura de clientes y deuda

##### Scenario: Domiciliario no puede crear cliente

- GIVEN un usuario autenticado como DOMICILIARIO
- WHEN intenta acceder a crear/editar/eliminar cliente o registrar abono
- THEN MUST denegar con error 403 o redirigir
