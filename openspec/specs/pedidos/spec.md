# Specs: Pedidos

> Envichips SaaS · Especificaciones detalladas
> Basado en PRD v1.1 — Módulo: Pedidos

---

## 1. Crear Pedido (Wizard 3 pasos)

**File**: `app/dashboard/pedidos/create/page.tsx` + `components/pedidos/PedidoForm.tsx`

### Purpose
Asistente de 3 pasos para crear pedidos de domicilio. Optimizado para mobile (una mano, < 2 minutos). Soporta venta directa (sin domiciliario) y pedidos asignados.

### Acceptance Criteria
- [ ] El wizard MUST tener 3 pasos navegables: (1) Cliente, (2) Productos, (3) Resumen
- [ ] **Paso 1 — Cliente**: MUST mostrar buscador de clientes existentes + opción "Venta rápida" con campo de texto para nombre libre
- [ ] **Paso 2 — Productos**: MUST incluir buscador de artículos con debounce (300ms), selector de cantidad con teclado numérico nativo, y subtotal por ítem actualizado en tiempo real
- [ ] **Paso 3 — Resumen**: MUST mostrar lista de items con subtotales, campo de descuento (opcional), selector de método de pago (EFECTIVO/TRANSFERENCIA/FIADO), selector de domiciliario (opcional para venta directa), campo de observaciones y total general
- [ ] Si `metodoPago = FIADO`, MUST mostrar la deuda actual del cliente como advertencia calculada en tiempo real mediante agregación (pedidos FIADO - abonos) utilizando el servicio de clientes
- [ ] Si no se asigna `domiciliarioId` (venta directa), MUST crear el pedido en estado `PENDIENTE` (disponible para auto-asignación por DOMICILIARIO; Admin transiciona a ENTREGADO manualmente)
- [ ] Si se asigna `domiciliarioId`, MUST crear el pedido en estado `PENDIENTE`
- [ ] MUST calcular `subtotal = Σ(cantidad × precio)`, `total = subtotal - descuento`
- [ ] MUST guardar `precio` y `costo` como snapshot en cada `PedidoItem` al momento de crear
- [ ] MUST validar con Zod antes de enviar al servidor
- [ ] MUST mostrar estado de carga en el botón de confirmar
- [ ] Al guardar exitosamente, MUST redirigir al detalle del pedido creado
- [ ] SHOULD tener botón "Volver" en cada paso sin perder datos ingresados
- [ ] DOMICILIARIO NO MUST tener acceso al wizard de creación ni ver el FAB de "Nuevo pedido". Solo ADMIN y SUPERADMIN pueden crear pedidos completos.

### Technical Notes
- Componente cliente con `"use client"`, estado del wizard con `useState` o URL params (`?step=1`)
- Buscador de clientes: Server Action `getClientesAction` (reutilizar de Fase 4 cuando exista, por ahora mock simple)
- Buscador de artículos: reutilizar patrón de `ArticleFilters` del módulo de artículos
- Server Action `createPedidoAction` en `app/dashboard/pedidos/actions.ts`
- El número de pedido se genera en el servicio: `ENV-{año}-{XXXXX}` con contador anual

### Test Scenarios
1. **Pedido completo**: seleccionar cliente, agregar 3 productos, confirmar → pedido creado en PENDIENTE con domiciliario asignado
2. **Venta directa queda PENDIENTE**: seleccionar cliente, productos, sin domiciliario → pedido creado en PENDIENTE, Admin debe transicionar a ENTREGADO manualmente
3. **FIADO con advertencia (deuda media)**: seleccionar cliente con deuda de $75.000, metodoPago FIADO → mostrar "Deuda actual: $75.000" en fondo amarillo (visible pero no bloqueante)
4. **FIADO con advertencia (deuda alta)**: seleccionar cliente con deuda de $150.000, metodoPago FIADO → mostrar "Deuda actual: $150.000" en fondo rojo
5. **FIADO sin deuda**: seleccionar cliente con deuda de $0, metodoPago FIADO → mostrar "Sin deuda" en fondo verde
6. **Venta rápida con FIADO**: venta rápida sin cliente, metodoPago FIADO → sin advertencia de deuda, permitir continuar
7. **Actualización en tiempo real**: cambiar cliente en paso 1 → advertencia de deuda se actualiza automáticamente sin recargar
4. **Volver sin perder datos**: paso 2 → volver a paso 1 → avanzar otra vez → datos del paso 1 preservados
5. **Validación sin items**: intentar confirmar sin productos → error "Debe incluir al menos un producto"
6. **Venta rápida**: escribir nombre en "Venta rápida", agregar items, confirmar → pedido creado sin cliente asociado

---

## 2. Listado de Pedidos

**File**: `app/dashboard/pedidos/page.tsx`

### Purpose
Listado de pedidos con vista adaptada al rol del usuario. Mobile-first con tarjetas, desktop con tabla.

### Acceptance Criteria
- [ ] **Rol Domiciliario**: MUST mostrar vista con tabs: "Disponibles" (PENDIENTE sin domiciliario) y "Mis pedidos" (propios: EN_CAMINO + ENTREGADO, sin filtro de día actual)
- [ ] **Rol Admin/SuperAdmin**: MUST mostrar TODOS los pedidos con filtros por: fecha (rango), domiciliario, estado y cliente
- [ ] MUST mostrar un badge de estado por pedido con color:
  - `PENDIENTE` → gris
  - `EN_CAMINO` → amarillo
  - `ENTREGADO` → verde
  - `CANCELADO` → rojo
- [ ] Cada tarjeta/ítem MUST mostrar: número de pedido, cliente, total (COP), estado (badge), domiciliario y fecha
- [ ] MUST tener buscador por número de pedido o nombre de cliente
- [ ] MUST tener ordenamiento por fecha descendente (default)
- [ ] SHOULD tener paginación (20 pedidos por página) o scroll infinito
- [ ] Al hacer clic en un pedido, MUST navegar al detalle (`/dashboard/pedidos/[id]`)

### Technical Notes
- Server Component para carga inicial con Server Action `getPedidosAction`
- Filtros: estado local con `useState` (componente cliente wrapper si es necesario)
- Tabla con shadcn/ui Table (desktop), grid de tarjetas (mobile)
- El Server Action recibe `userId` y `rol` del session para filtrar por rol

### Test Scenarios
1. **DOMICILIARIO ve tabs disponibles + activos**: login como DOMICILIARIO → listado muestra "Disponibles" (PENDIENTE sin domiciliario) y "Mis pedidos" (propios)
2. **Sin pedidos disponibles**: DOMICILIARIO en listado sin PENDIENTE sin domiciliario → tab "Disponibles" MUST mostrar "No hay pedidos disponibles"
3. **Admin ve todos**: login como admin → listado muestra todos los pedidos con filtros disponibles
3. **Filtro por estado**: seleccionar "ENTREGADO" → solo pedidos entregados visibles
4. **Búsqueda**: escribir número de pedido → filtrar por coincidencia
5. **Pedido sin resultados**: filtrar por fecha sin pedidos → mostrar "No se encontraron pedidos"

---

## 3. Detalle del Pedido

**File**: `app/dashboard/pedidos/[id]/page.tsx`

### Purpose
Vista completa de un pedido con items, totales, información de cliente/domiciliario, historial de estados y acciones disponibles según rol y estado actual.

### Acceptance Criteria
- [ ] MUST mostrar: número de pedido, fecha, estado (badge grande), cliente, domiciliario, método de pago y observaciones
- [ ] MUST listar todos los items del pedido con: artículo, cantidad, precio unitario, subtotal
- [ ] MUST mostrar subtotal, descuento y total en formato COP
- [ ] MUST mostrar el historial de cambios de estado (timeline) con: estado anterior → nuevo estado, usuario que lo cambió, fecha y motivo (si aplica)
- [ ] MUST mostrar botones de acción según rol y estado actual:
  - Admin: cambiar a cualquier estado, cancelar
  - Domiciliario: marcar EN_CAMINO, marcar ENTREGADO (con campos de cobro)
- [ ] MUST tener botón "Imprimir" que navega a la ruta de impresión (placeholder para Fase 3)
- [ ] Si el pedido está ENTREGADO y `pagoEntregadoAdmin = false`, el Admin MUST ver botón "Confirmar recepción de efectivo"
- [ ] SHOULD mostrar indicador de cobro: si `dineroCobrado = true` mostrar badge "Cobrado: $XXX" o si `false` mostrar "Pendiente de cobro"

### Technical Notes
- Server Component que obtiene pedido con `getPedidoByIdAction`
- Timeline con Tailwind: dots + líneas verticales
- Botones de acción: componentes cliente que llaman Server Actions
- El historial de estados viene de `HistorialEstado` ordenado por fecha

### Test Scenarios
1. **Ver detalle completo**: entrar a pedido existente → ver todos los datos, items e historial
2. **Botones visibles según rol**: login como domiciliario → ver botón "Marcar en camino" pero no "Cancelar"
3. **Timeline de estados**: pedido con 3 cambios de estado → timeline muestra todos en orden
4. **Confirmar cobro**: admin ve pedido ENTREGADO con pagoEntregadoAdmin=false → botón visible → click → estado actualizado

---

## 4. Gestión de Estados

**File**: `app/dashboard/pedidos/[id]/page.tsx` (acciones de estado)

### Purpose
Transiciones de estado del pedido con validación de reglas de negocio, descuento automático de inventario y registro en HistorialEstado.

### Acceptance Criteria
- [ ] Las transiciones permitidas MUST ser:
  - `PENDIENTE → EN_CAMINO` (DOMICILIARIO — propio pedido; o ADMIN)
  - `PENDIENTE → ENTREGADO` (ADMIN/SUPERADMIN — venta directa sin domiciliario, con stock validation; NO permitido para DOMICILIARIO)
  - `PENDIENTE → CANCELADO` (solo ADMIN o SUPERADMIN, requiere motivo; DOMICILIARIO no ve ni accede al botón de cancelar)
  - `EN_CAMINO → ENTREGADO` (DOMICILIARIO — propio pedido; o ADMIN, requiere datos de cobro)
  - `EN_CAMINO → CANCELADO` (solo admin, requiere motivo, MUST revertir stock)
- [ ] DOMICILIARIO NO MUST poder saltar estados: PENDIENTE→ENTREGADO directo MUST ser bloqueado con error
- [ ] Al pasar a `ENTREGADO`, MUST:
  - Validar stock: para cada item del pedido, `articulo.stockActual >= item.cantidad`. Si insuficiente: error "Stock insuficiente para [artículo]: disponible X, requerido Y" y NO cambiar estado
  - Derivar `estadoCobro` según `metodoPago`:
    - `EFECTIVO`: si domiciliario indica cobro → `COBRADO_PARCIAL`, si no → `PENDIENTE`
    - `TRANSFERENCIA`: siempre → `COBRADO_PARCIAL` (admin confirma vía `confirmarCobroAdmin`)
    - `FIADO`: siempre → `PENDIENTE`
  - Descontar stock de cada artículo: `stockActual -= cantidad` en transacción atómica (solo después de validación exitosa)
  - Si `metodoPago = FIADO`, MUST utilizar el servicio de clientes para registrar el pedido de manera que la deuda se calcule dinámicamente mediante agregación (pedidos FIADO - abonos) en lugar de modificar directamente un campo `cliente.deuda`
  - Crear registro en `HistorialEstado`
- [ ] Al cancelar un pedido que estaba `EN_CAMINO`, MUST revertir el stock (si ya se había descontado — en realidad no se descuenta hasta ENTREGADO, así que no hay nada que revertir para EN_CAMINO)
- [ ] Al cancelar desde `PENDIENTE`, MUST solo crear registro en `HistorialEstado` (sin cambios de stock)
- [ ] Cada transición MUST crear un registro en `HistorialEstado` con: estadoAntes, estadoDespues, cambiadoPorId, motivo (si aplica)
- [ ] MUST validar que la transición sea permitida según el estado actual
- [ ] MUST usar `prisma.$transaction` para operaciones que modifican stock

### Technical Notes
- Lógica de transiciones en `lib/services/pedidos.ts`
- `actualizarEstado(id, data)` recibe el nuevo estado y datos opcionales
- Usar transacción: update pedido + create historial + update stock + update cliente (si FIADO)
- La validación de transiciones permitidas está en el servicio

### Test Scenarios
1. **Pendiente → En Camino**: DOMICILIARIO con pedido asignado PENDIENTE → cambia a EN_CAMINO, historial creado
2. **DOMICILIARIO no puede saltar estados**: DOMICILIARIO intenta PENDIENTE→ENTREGADO → error "Transición no permitida"
3. **Admin puede PENDIENTE→ENTREGADO (venta directa)**: Admin con pedido PENDIENTE sin domiciliario → transición permitida, stock validado y descontado
4. **En Camino → Entregado con cobro**: marcar ENTREGADO con EFECTIVO+cobro → estadoCobro=COBRADO_PARCIAL, stock descontado, historial
5. **Stock validation antes ENTREGADO**: pedido EN_CAMINO con item de 5 unidades y stockActual=2 → error "Stock insuficiente", estado NO cambia
6. **Cancelar desde Pendiente**: cancelar con motivo → estado CANCELADO, historial con motivo
7. **Transición inválida**: intentar pasar de PENDIENTE a ENTREGADO para DOMICILIARIO → error
8. **FIADO crea pedido y deuda se calcula**: pedido FIADO de $30.000 con cliente con deuda de $50.000 → deuda consultada retorna $80.000
9. **FIADO con abono**: pedido FIADO de $25.000 → deuda retorna $85.000
10. **FIADO CANCELADO no afecta deuda**: pedido FIADO de $30.000 cancelado → deuda del cliente sigue siendo $50.000

### 4.1 Modificación de Pedidos (contenido del pedido)

**Files**: `lib/validations/pedidos.ts` (modificarPedidoSchema), `lib/services/pedidos.ts` (modificarPedido), `app/(dashboard)/pedidos/actions.ts` (modificarPedidoAction)

#### Purpose
Permitir que ADMIN/SUPERADMIN modifique el contenido de pedidos en estado PENDIENTE o EN_CAMINO — editar cantidades, agregar o eliminar items — con validación de inventario, recálculo de totales y auditoría en HistorialEstado.

#### Acceptance Criteria
- [ ] **Access**: Solo ADMIN y SUPERADMIN MUST poder modificar pedidos. DOMICILIARIO MUST NO tener acceso a la funcionalidad de modificación.
- [ ] **Estados permitidos**: La modificación MUST solo permitirse para pedidos en `PENDIENTE` o `EN_CAMINO`. Pedidos `ENTREGADO` o `CANCELADO` MUST NO ser modificables.
- [ ] **Operaciones sobre items**:
  - MUST poder aumentar o disminuir cantidad de items existentes
  - MUST poder eliminar items del pedido
  - MUST poder agregar nuevos items al pedido
  - MUST validar que al menos un item permanezca después de la modificación
  - Items existentes: MUST mantener el snapshot original de `precio` y `costo`
  - Items nuevos: MUST snapshotear el `precio` y `costo` actual del Articulo al momento de la modificación
- [ ] **Recálculo de totales**: MUST recalcular `subtotal = Σ(item.subtotal)` y `total = subtotal - descuento` (descuento no cambia)
- [ ] **Validación de stock**: MUST validar `articulo.stockActual >= item.cantidad` para TODOS los items finales. Si insuficiente: error y rechazar toda la modificación
- [ ] **Re-validación FIADO**: Si `metodoPago = FIADO` y el total cambia, MUST re-validar el límite de crédito vía `validateFiadoDebt`
- [ ] **Atomicidad**: TODAS las operaciones MUST ejecutarse en una sola transacción Prisma `$transaction`. Rollback total ante cualquier fallo
- [ ] **Auditoría**: MUST crear HistorialEstado con `estadoAntes === estadoDespues`, `motivo` descriptivo (ej: "Items modificados: Papas x5→x3, Plátanos x2 agregado"), y `cambiadoPorId`

#### Technical Notes
- Nueva función `modificarPedido()` en `lib/services/pedidos.ts`
- Diff de items: identificar cuáles crear, actualizar y eliminar
- Snapshots de precio/costo solo para items nuevos
- Re-validación completa de stock (no solo items cambiados)
- Patrón de transacción: delete removed → update existing → create new → recalc totals → update Pedido → create HistorialEstado
- Misma validación de roles que `cancelarPedido` (requireRole ADMIN/SUPERADMIN)
- Ver spec completa en `openspec/changes/devoluciones-y-modificacion-pedidos/specs/devoluciones-modificacion/spec.md`

#### Test Scenarios
1. **Editar cantidad**: DADO pedido PENDIENTE con Papas x5, CUANDO Admin cambia a Papas x3, ENTONCES cantidad actualizada, subtotal recalculado, HistorialEstado creado
2. **Agregar item**: DADO pedido PENDIENTE, CUANDO Admin agrega Plátanos x2, ENTONCES nuevo PedidoItem con precio/costo actual, total recalculado
3. **Eliminar item**: DADO pedido PENDIENTE con 3 items, CUANDO Admin elimina 1, ENTONCES item borrado, total recalculado
4. **Stock insuficiente**: DADO pedido con Papas x5 y stockActual=3, CUANDO Admin cambia a Papas x10, ENTONCES error "Stock insuficiente"
5. **FIADO re-validación**: DADO pedido FIADO donde agregar items excede límite, CUANDO Admin modifica, ENTONCES error "Límite de crédito excedido"
6. **DOMICILIARIO bloqueado**: DADO usuario DOMICILIARIO, CUANDO intenta modificar, ENTONCES error "No autorizado"

---

## 5. Ciclo de Cobro

**File**: `app/dashboard/pedidos/[id]/page.tsx` + `app/dashboard/pedidos/actions.ts`

### Purpose
Seguimiento del ciclo de cobro de efectivo separado del estado de entrega. El domiciliario indica si cobró al entregar, el admin confirma cuando recibe el efectivo físicamente.

### Acceptance Criteria
- [ ] `estadoCobro` MUST derivarse al marcar ENTREGADO según `metodoPago`:
  - `EFECTIVO`: si domiciliario indica cobro → `COBRADO_PARCIAL`, si no → `PENDIENTE`
  - `TRANSFERENCIA`: siempre → `COBRADO_PARCIAL` (admin confirma vía `confirmarCobroAdmin`)
  - `FIADO`: siempre → `PENDIENTE`
- [ ] El campo `pagoEntregadoAdmin` MUST ser `false` por defecto
- [ ] El Admin/SuperAdmin MUST poder cambiar `estadoCobro` de `COBRADO_PARCIAL` a `COBRADO` desde el detalle del pedido
- [ ] Al confirmar cobro, MUST setear `pagoEntregadoAdmin = true`, `pagoEntregadoEn = now()`, y crear `HistorialEstado` con motivo "Cobro confirmado por administrador"
- [ ] Un pedido con `estadoCobro = COBRADO` NO MUST permitir confirmar cobro nuevamente (doble confirmación bloqueada)
- [ ] El estado de cobro MUST ser independiente del estado de entrega (un pedido ENTREGADO puede tener cobro pendiente)
- [ ] MUST mostrar badge de cobro según `estadoCobro`:
  - `PENDIENTE` → badge "Pendiente de cobro"
  - `COBRADO_PARCIAL` → badge "Cobro parcial"
  - `COBRADO` → badge "Cobrado"
- [ ] El botón "Confirmar cobro admin" MUST mostrarse solo cuando `estadoCobro = COBRADO_PARCIAL` AND `!pagoEntregadoAdmin` AND isAdmin

### Technical Notes
- Server Action `confirmarCobroAdminAction(id)` en actions.ts
- `pagoEntregadoAdmin` cambia con `$transaction` para asegurar consistencia
- El campo `pagoEntregadoEn` se setea con `new Date()` en Colombia timezone

### Test Scenarios
1. **EFECTIVO con cobro → COBRADO_PARCIAL**: domiciliario marca ENTREGADO con EFECTIVO+cobro → estadoCobro=COBRADO_PARCIAL
2. **EFECTIVO sin cobro → PENDIENTE**: domiciliario marca ENTREGADO con EFECTIVO+sin cobro → estadoCobro=PENDIENTE
3. **TRANSFERENCIA → COBRADO_PARCIAL**: domiciliario marca ENTREGADO con TRANSFERENCIA → estadoCobro=COBRADO_PARCIAL (siempre, admin confirma después)
4. **FIADO → PENDIENTE**: domiciliario marca ENTREGADO con FIADO → estadoCobro=PENDIENTE
5. **Admin confirma cobro (COBRADO_PARCIAL→COBRADO)**: admin confirma cobro → estadoCobro=COBRADO, pagoEntregadoAdmin=true, timestamp, HistorialEstado
6. **Doble confirmación bloqueada**: intentar confirmar cobro con estadoCobro=COBRADO → error "El cobro ya fue confirmado"
7. **Badge según estado**: PENDIENTE→"Pendiente de cobro", COBRADO_PARCIAL→"Cobro parcial", COBRADO→"Cobrado"

---

## 6. Server Actions

**File**: `app/dashboard/pedidos/actions.ts`

### Purpose
Capa de Server Actions para el módulo de pedidos, siguiendo el patrón de `articulos/actions.ts`.

### Acceptance Criteria
- [ ] `getPedidosAction(filtros?)` MUST retornar lista de pedidos según rol del usuario autenticado
- [ ] `getPedidoByIdAction(id)` MUST retornar pedido completo con items, historial, cliente y domiciliario
- [ ] `createPedidoAction(data)` MUST validar con Zod, generar numeroPedido, crear pedido con items en transacción
- [ ] `createPedidoAction` MUST llamar `requireRole("ADMIN", user)` antes de procesar la creación
- [ ] `updateEstadoAction(id, data)` MUST recibir el usuario autenticado, delegar validación de rol al servicio (no `requireRole` en la action), validar transición, actualizar estado, crear historial, validar stock y descontar si ENTREGADO, derivar estadoCobro per metodoPago, actualizar deuda si FIADO
- [ ] `tomarPedidoAction(id)` **NUEVO**: MUST requerir rol DOMICILIARIO, llamar `tomarPedido(id, userId)` con atomicidad (conditional WHERE + transacción), crear HistorialEstado con motivo "Domiciliario asignado por auto-asignación"
- [ ] `cancelarPedidoAction(id, motivo)` MUST validar que el pedido no esté ENTREGADO, crear historial con motivo
- [ ] `confirmarCobroAdminAction(id)` MUST validar que el pedido esté ENTREGADO y `estadoCobro = COBRADO_PARCIAL` y `pagoEntregadoAdmin = false`, luego setear `estadoCobro = COBRADO`, `pagoEntregadoAdmin = true`, `pagoEntregadoEn = now()`, crear HistorialEstado
- [ ] TODOS los Server Actions MUST capturar errores y retornar `{ error: string }` en caso de fallo
- [ ] TODOS los Server Actions MUST usar `"use server"` directive
- [ ] TODOS los Server Actions MUST hacer `revalidatePath("/dashboard/pedidos")` en mutaciones exitosas

### Technical Notes
- Separar lógica de BD en `lib/services/pedidos.ts`
- Las validaciones Zod están en `lib/validations/pedidos.ts`
- `updateEstadoAction` y `cancelarPedidoAction` verifican permisos según rol

---

## 7. Validaciones Zod

**File**: `lib/validations/pedidos.ts`

### Purpose
Esquemas de validación compartidos entre cliente y servidor para el módulo de pedidos.

### Acceptance Criteria
- [ ] `createPedidoSchema` MUST validar: clienteId (uuid opcional), clienteNombre (string opcional si es venta rápida), items (array de PedidoItemInput, min 1), metodoPago (enum), descuento (int >= 0, default 0, opcional), domiciliarioId (uuid opcional), observaciones (string opcional, max 500)
- [ ] `PedidoItemInput` MUST validar: articuloId (uuid), cantidad (int positivo)
- [ ] `updateEstadoSchema` MUST validar: estado (EstadoPedido), motivo (string opcional, required si estado=CANCELADO), dineroCobrado (boolean opcional), montoCobrado (int >= 0 opcional), estadoCobro (EstadoCobroEnum opcional)
- [ ] `confirmarCobroSchema` MUST validar: pedidoId (uuid)
- [ ] MUST reutilizar `MetodoPagoEnum` de `lib/validations/articulos.ts`
- [ ] MUST incluir `EstadoCobroEnum` como `z.enum(["PENDIENTE", "COBRADO_PARCIAL", "COBRADO"])`
- [ ] MUST tener output types: `CreatePedidoInput`, `UpdateEstadoInput`

### Technical Notes
- Usar `z.enum()` para EstadoPedido (definir el enum en validaciones)
- `z.output<>` para tipar parámetros de Server Actions
- COP: `z.number().int().min(0)`
- El clienteNombre es opcional y se usa solo cuando no hay clienteId (venta rápida)

---

## 8. Factura e Impresión

**File**: `app/dashboard/pedidos/[id]/imprimir/page.tsx`

### Purpose
Vista de impresión de facturas para pedidos, soportando impresoras térmicas (58mm y 80mm) y formato A4, con auto-trigger de impresión al cargar la página.

### Acceptance Criteria
- [ ] Al navegar a `/dashboard/pedidos/[id]/imprimir`, MUST mostrar una vista lista para imprimir con el layout de factura
- [ ] La factura MUST incluir: encabezado de marca Envichips, número de pedido, fecha, información de cliente y domiciliario, tabla de ítems con descripción, cantidad y subtotal, sección de totales (subtotal, descuento, total), método de pago y observaciones
- [ ] Al cargar la página, MUST disparar automáticamente `window.print()` para mostrar el cuadro de diálogo de impresión
- [ ] El CSS de impresión MUST adaptar correctamente el layout para impresoras térmicas de 58mm de ancho (máximo 56mm de contenido) y 80mm de ancho (máximo 76mm de contenido)
- [ ] El CSS de impresión MUST soportar formato A4 (210mm x 297mm) con márgenes apropiados
- [ ] Todos los valores monetarios MUST mostrarse en formato COP sin decimales (ej: `$1.500.000`)
- [ ] La tipografía MUST ser legible en impresoras térmicas (tamaño mínimo 8pt para contenido, 10pt para encabezados)
- [ ] El ancho de columnas en la tabla de ítems MUST ajustarse para evitar corte de texto en impresoras térmicas

### Technical Notes
- Usar `getPedidoByIdAction` para obtener los datos del pedido (mismo que el detalle)
- Implementar estilos de impresión usando `@media print` y consultas de ancho para diferenciar entre térmicas y A4
- Considerar usar unidades absolutas (mm, pt) en lugar de px para mejor control en impresión
- Para térmicas: ocultar elementos no esenciales, reducir espaciados, usar fuentes sans-serif
- Para A4: mantener layout completo con márgenes estándar de impresión
- El auto-trigger de window.print() MUST ejecutarse en `useEffect` con dependencia vacía para correr solo en mount
- Si el navegador bloquea el pop-up, proporcionar instrucciones manuales para imprimir (Ctrl+P o Cmd+P)

### Test Scenarios
1. **Impresión en térmica 58mm**: navegar a ruta de impresión → cuadro de diálogo muestra vista previa ajustada a 58mm → imprimir en térmica 58mm muestra factura legible sin cortes
2. **Impresión en térmica 80mm**: navegar a ruta de impresión → cuadro de diálogo muestra vista previa ajustada a 80mm → imprimir en térmica 80mm muestra factura completa con buen espaciado
3. **Impresión en A4**: navegar a ruta de impresión → cuadro de diálogo muestra vista previa A4 → imprimir en A4 muestra factura con márgenes normales y buena presentación
4. **Auto-trigger de impresión**: al llegar a la página, se muestra automáticamente el cuadro de diálogo de impresión del navegador
5. **Datos correctos mostrados**: número de pedido, fecha, cliente, domiciliario, items, totales y método de pago coinciden con el detalle del pedido
6. **Formato COP**: todos los montos mostrados sin decimales y con separador de miles (ej: `$1.500.000` no `$1500.00`)

---

## 9. Uso de Servicio de Clientes para Cálculo de Deuda

### Purpose
El sistema de pedidos MUST delegar el cálculo de deuda al servicio de clientes en lugar de mantener lógica de cálculo duplicada. Esto asegura consistencia entre módulos y permite reutilizar la misma lógica de cálculo en todo el sistema.

### Acceptance Criteria
- [ ] El módulo de pedidos MUST consultar la deuda del cliente usando `getDeudaCliente()` del servicio de clientes
- [ ] El módulo de pedidos NO MUST mantener lógica propia de cálculo de deuda
- [ ] La función de cálculo de deuda MUST ser la misma utilizada por el módulo de clientes

### Test Scenarios
1. **Consistencia entre módulos**: consultar deuda desde pedidos y desde clientes → ambos retornos idénticos usando la misma función subyacente

---

## Non-Functional Requirements

- **Debounce**: búsqueda de productos en paso 2 MUST usar debounce de 300ms
- **Atomicidad**: todas las operaciones que modifican stock (ENTREGADO, CANCELADO) MUST usar transacciones de Prisma
- **Responsive**: wizard full-screen en mobile (<768px), modal o layout en desktop
- **COP formatting**: todos los montos MUST mostrarse en formato `$1.500.000` (sin decimales, separador de miles)
- **Error handling**: Server Actions MUST retornar `{ error: "mensaje" }` o `{ data: ... }` consistentemente
- **Role checking**: acciones sensibles (cancelar, confirmar cobro) MUST verificar rol del usuario autenticado
