# Visitas a Clientes Specification

## Purpose

Registro de visitas a clientes — automáticas (al entregar pedidos) y manuales (por Admin) — consulta de última visita, y alerta de clientes activos con 7+ días sin atención.

## Requirements

### Requirement: Modelo RegistroVisita

El sistema MUST contar con un modelo `RegistroVisita` (id PK, clienteId FK→Cliente, userId FK→User, fecha datetime, notas text? nullable) con índice compuesto [clienteId, fecha].

#### Scenario: Persistencia correcta

- GIVEN parámetros clienteId, userId, fecha válidos
- WHEN se crea un RegistroVisita
- THEN MUST persistir con todos los campos
- AND MUST ser consultable por clienteId + fecha

### Requirement: Registrar visita manual

El sistema MUST permitir a SUPERADMIN y ADMIN registrar una visita manual desde el listado o detalle de un cliente mediante modal con campo notas opcional.

#### Scenario: Registro manual exitoso

- GIVEN un usuario ADMIN autenticado
- WHEN hace clic en "Registrar visita", ingresa notas opcionales y confirma
- THEN MUST crear RegistroVisita con fecha actual y userId del admin
- AND MUST refrescar la columna "Última visita"

#### Scenario: Domiciliario sin acceso

- GIVEN un usuario DOMICILIARIO autenticado
- THEN NO MUST ver el botón "Registrar visita"
- AND NO MUST poder ejecutar el server action de registro

### Requirement: Visita automática al entregar pedido

El sistema MUST crear un RegistroVisita automáticamente cuando un pedido transiciona a estado ENTREGADO, usando el userId que ejecutó la transición.

#### Scenario: Auto-visita en ENTREGADO exitoso

- GIVEN un pedido que transiciona a ENTREGADO exitosamente
- THEN MUST crear RegistroVisita con clienteId del pedido, userId del ejecutor, y fecha actual
- AND la operación MUST ser atómica (fallo en visita → revierte cambio de estado)

### Requirement: Alerta de 7+ días sin visita

El sistema MUST calcular días desde la última visita (o desde creadoEn si no hay visitas) para clientes activos y mostrar alerta visual si ≥ 7 días. Clientes inactivos (activo=false) MUST ser excluidos de la alerta.

#### Scenario: Cliente nuevo sin visitas

- GIVEN un cliente activo con creadoEn hace 9 días y 0 visitas
- WHEN se consulta el estado de alerta
- THEN MUST mostrar alerta "9 días sin visita"

#### Scenario: Cliente visitado recientemente

- GIVEN un cliente activo visitado hace 3 días
- WHEN se consulta el estado de alerta
- THEN NO MUST mostrar alerta

#### Scenario: Cliente inactivo excluido

- GIVEN un cliente con activo=false y 15 días sin visita
- WHEN se consulta el estado de alerta
- THEN NO MUST mostrar alerta

### Requirement: Dashboard — contador de clientes sin visita

El sistema MUST mostrar en el dashboard principal una tarjeta con el número de clientes activos con ≥ 7 días sin visita, con enlace al listado de clientes filtrado.

#### Scenario: Contador con enlace

- GIVEN 3 clientes activos con >7 días sin visita y 10 que sí han sido visitados
- WHEN se carga el dashboard
- THEN MUST mostrar tarjeta "3 clientes sin visitar >7 días"
- AND MUST ser un enlace a /clientes?filter=sin-visita

#### Scenario: Sin clientes en alerta

- GIVEN 0 clientes activos con >7 días sin visita
- WHEN se carga el dashboard
- THEN MUST mostrar tarjeta "Todos los clientes al día" sin enlace
