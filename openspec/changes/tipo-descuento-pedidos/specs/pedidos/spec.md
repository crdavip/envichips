# Delta for Pedidos

## MODIFIED Requirements

### Requirement: Crear Pedido (Wizard 3 pasos)

Step 3 MUST add a tipoDescuento selector (radio/segmented): NINGUNO (default), GLOBAL, ESPECIAL. Selector visible solo para ADMIN/SUPERADMIN.

- **GLOBAL**: input descuento COP (min=0, max=subtotal), guarda Pedido.tipoDescuento="GLOBAL", Pedido.descuento=monto. Comportamiento idéntico al actual.
- **ESPECIAL**: ocultar input descuento. Cada item MUST mostrar precio unitario como input editable (min=0, sin max). Subtotal MUST recalcularse en vivo. Total = subtotal (sin descuento adicional). Guarda Pedido.tipoDescuento="ESPECIAL", Pedido.descuento=0. Cada PedidoItem guarda precio (efectivo) y precioOriginal (snapshot de Articulo.precio).
- **NINGUNO**: sin inputs de descuento ni precios editables.
(Previously: Step 3 solo tenía input descuento COP fijo.)

#### Scenario: ADMIN crea pedido GLOBAL
- GIVEN usuario ADMIN en Step 3 con productos
- WHEN selecciona GLOBAL e ingresa descuento $10.000
- THEN subtotal inalterado, total = subtotal - $10.000, Pedido.tipoDescuento="GLOBAL"

#### Scenario: ADMIN crea pedido ESPECIAL
- GIVEN usuario ADMIN en Step 3 con productos (precio $5.000 c/u)
- WHEN selecciona ESPECIAL y edita precio a $4.000 en un item
- THEN input descuento oculto, subtotal recalculado con $4.000, total = subtotal, PedidoItem.precio=$4.000, PedidoItem.precioOriginal=$5.000

#### Scenario: ADMIN crea pedido NINGUNO
- GIVEN usuario ADMIN en Step 3
- WHEN selecciona NINGUNO
- THEN no inputs de descuento ni precios editables, Pedido.tipoDescuento="NINGUNO"

### Requirement: Detalle del Pedido (Section 3)

MUST mostrar tipoDescuento como badge. Si ESPECIAL: MUST mostrar precioOriginal y precio efectivo por item, y línea "Ahorro por descuento especial: $X.XXX".
(Previously: no mostraba tipoDescuento ni precios diferenciados por item.)

#### Scenario: ADMIN ve detalle ESPECIAL
- GIVEN pedido ESPECIAL con 2 items (precios modificados)
- WHEN ADMIN navega al detalle
- THEN badge "ESPECIAL" visible, cada item muestra precio tachado y efectivo, ahorro total calculado

#### Scenario: DOMICILIARIO ve detalle ESPECIAL
- GIVEN pedido ESPECIAL
- WHEN DOMICILIARIO navega al detalle
- THEN misma info visible, readonly, sin acciones de modificación

### Requirement: Factura e Impresión (Section 8)

MUST mostrar tipoDescuento. Si ESPECIAL: MUST mostrar precioOriginal y precio efectivo por item, y línea "Descuento especial: $X.XXX".
(Previously: solo subtotal, descuento, total.)

#### Scenario: Impresión ESPECIAL
- GIVEN pedido ESPECIAL con items modificados
- WHEN vista de impresión carga
- THEN factura incluye badge ESPECIAL, columna precios original/efectivo, línea de ahorro

### Requirement: Modificación de Pedidos (Section 4.1)

Si tipoDescuento=ESPECIAL: MUST permitir editar precio unitario de items existentes. Items nuevos: precioPersonalizado opcional (default = Articulo.precio). MUST mantener precioOriginal de items existentes.
(Previously: precios eran snapshots fijos no editables.)

#### Scenario: Editar precio en ESPECIAL
- GIVEN pedido PENDIENTE con tipoDescuento=ESPECIAL (item $5.000/precioOriginal $5.000)
- WHEN Admin cambia precio a $4.000 en modal de modificación
- THEN precio=$4.000, precioOriginal=$5.000, subtotal y total recalculados, HistorialEstado creado

### Requirement: Validaciones Zod (Section 7)

MUST agregar: `tipoDescuento: z.enum(["NINGUNO","GLOBAL","ESPECIAL"])`. Si ESPECIAL: descuento=0, cada item MAY incluir `precioPersonalizado: z.number().int().min(0).optional()`. PedidoItemInput: `precioPersonalizado?: z.number().int().min(0)`.
(Previously: solo validaba descuento COP.)

## ADDED Requirements

### Requirement: Persistencia Schema

Pedido.tipoDescuento MUST ser enum TipoDescuento { NINGUNO, GLOBAL, ESPECIAL } con default NINGUNO. PedidoItem.precioOriginal (Int) MUST ser snapshot de Articulo.precio al crear el item. PedidoItem.precio MUST ser el precio efectivo (idéntico a precioOriginal en modos NINGUNO y GLOBAL; modificable en ESPECIAL).

#### Scenario: Migración datos existentes
- GIVEN pedidos existentes sin tipoDescuento ni precioOriginal
- WHEN migración ejecutada
- THEN tipoDescuento="GLOBAL" para pedidos con descuento>0, tipoDescuento="NINGUNO" para descuento=0, precioOriginal=precio en todos los PedidoItem existentes
