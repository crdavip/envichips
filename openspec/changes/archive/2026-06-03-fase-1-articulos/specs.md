# Specs: Fase 1 — Artículos

> Envichips SaaS · Especificaciones detalladas
> Basado en PRD v1.1 — Módulo: Artículos

---

## 1. Catálogo de Artículos

**File**: `app/(dashboard)/articulos/page.tsx`

### Purpose
Listado completo del catálogo de productos con vista responsive, filtros, búsqueda en tiempo real e indicadores de stock. Es la puerta de entrada al módulo de Artículos.

### Acceptance Criteria
- [ ] La ruta `/dashboard/articulos` MUST mostrar el listado de artículos
- [ ] El listado MUST tener dos vistas: grilla en mobile (<768px) y tabla en desktop (≥768px)
- [ ] La vista de grilla MUST mostrar cada artículo como tarjeta con: nombre, precio, ganancia, stock actual y badge de estado
- [ ] La vista de tabla MUST mostrar columnas: nombre, categoría, presentación, costo, precio, ganancia, stock, badge de estado y acciones
- [ ] MUST incluir filtros desplegables por categoría y presentación
- [ ] MUST incluir un campo de búsqueda por nombre con debounce (300ms)
- [ ] Los filtros y la búsqueda MUST operar del lado del cliente cuando todos los artículos están cargados
- [ ] Los artículos con `activo: false` MUST aparecer visualmente atenuados o con indicador "Inactivo"
- [ ] Cada artículo MUST mostrar un badge de estado de stock:
  - Stock OK (verde) cuando `stockActual >= stockMinimo`
  - Stock Bajo (amarillo) cuando `stockActual > 0 AND stockActual < stockMinimo`
  - Sin Stock (rojo) cuando `stockActual = 0`
- [ ] Las acciones inline MUST incluir: editar (lápiz) y toggle activo/inactivo
- [ ] SHOULD tener ordenamiento por nombre, precio y stock (click en encabezados de tabla)
- [ ] MAY incluir paginación o scroll infinito si hay más de 100 artículos

### Technical Notes
- Componente cliente con `"use client"` para interactividad de filtros
- Data fetching inicial con Server Action `getArticulos()`
- Filtros y búsqueda: estado local con `useState`, búsqueda con `useEffect` + debounce
- La tabla usa componentes shadcn/ui Table
- La grilla usa un grid de Tailwind: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Badge de stock: componente reutilizable `StockBadge`

### Test Scenarios
1. **Carga inicial**: entrar a `/dashboard/articulos` → ver listado completo ordenado por nombre A-Z
2. **Filtro por categoría**: seleccionar "PAPA" → solo artículos de esa categoría
3. **Búsqueda**: escribir "limón" → mostrar solo artículos que contengan "limón" en el nombre
4. **Filtro + búsqueda combinados**: seleccionar categoría "PAPA" + buscar "65g" → solo Papa Limón 65g
5. **Stock Badge**: artículo con stock 0 → badge rojo "Sin Stock"
6. **Artículo inactivo**: artículo con `activo: false` → mostrado atenuado

---

## 2. Crear / Editar Artículo

**File**: `components/articulos/ArticleForm.tsx`

### Purpose
Formulario para crear y editar artículos del catálogo. Incluye validación en cliente y servidor, cálculo automático de ganancia y soft delete.

### Acceptance Criteria
- [ ] El formulario MUST tener campos: nombre (text), categoría (select), presentación (select), costo (number, COP), precio (number, COP), stock mínimo (number)
- [ ] El campo `ganancia` MUST ser de solo lectura y calcularse automáticamente como `precio - costo`
- [ ] La validación MUST verificar que `precio > costo`
- [ ] Las categorías MUST mostrarse como opciones de un select: PAPA, PLATANO, MADURO, CHICHARRON, ROSQUITA, ROSCA, DETODITO, ARITOS, OTRO
- [ ] Las presentaciones MUST mostrarse como: G50, G65, G250, G500, OTRO
- [ ] En modo edición, MUST cargar los datos existentes del artículo
- [ ] MUST validar con Zod tanto en cliente como en servidor antes de guardar
- [ ] Al guardar, MUST mostrar estado de carga en el botón
- [ ] En caso de error del servidor, MUST mostrar mensaje de error sin perder los datos del formulario
- [ ] Al guardar exitosamente, MUST redirigir al listado de artículos
- [ ] La eliminación (soft delete) MUST usar Server Action `deleteArticulo` que setea `activo: false`
- [ ] Antes de eliminar, MUST mostrar confirmación: "¿Estás seguro de desactivar {nombre}?"

### Technical Notes
- Server Action `createArticulo` / `updateArticulo` en `app/(dashboard)/articulos/actions.ts`
- Zod schema en `lib/validations/articulos.ts`
- Usar `useActionState` de React 19 para manejar estado del formulario
- Selects de shadcn/ui para categoría y presentación
- Input type="number" para campos numéricos (COP)
- El server action de crear/editar valida con Zod, luego upsert en Prisma

### Test Scenarios
1. **Crear artículo exitoso**: llenar todos los campos → guardar → redirect a listado con el nuevo artículo visible
2. **Validación precio <= costo**: poner precio 1000 y costo 2000 → error "El precio debe ser mayor al costo"
3. **Campos requeridos**: dejar nombre vacío → error de validación
4. **Editar artículo**: modificar precio de artículo existente → guardar → ver cambios en listado
5. **Desactivar artículo**: confirmar desactivación → artículo aparece atenuado en listado
6. **Ganancia auto-calculada**: poner costo 2250 y precio 2800 → ganancia muestra 550

---

## 3. Registro de Compras (Entradas de Inventario)

**File**: `components/articulos/PurchaseModal.tsx`

### Purpose
Modal de 2 pasos para registrar la entrada de mercancía al inventario. Al confirmar, actualiza el stock de cada artículo automáticamente.

### Acceptance Criteria
- [ ] El modal MUST tener 2 pasos navegables:
  - **Paso 1**: selección de artículos con buscador + cantidad por artículo
  - **Paso 2**: resumen de la compra: lista de items con cantidades y subtotales, total, método de pago, campo de observaciones
- [ ] El buscador de artículos en Paso 1 MUST filtrar en tiempo real por nombre
- [ ] MUST permitir agregar múltiples artículos a la compra (cada uno con su cantidad)
- [ ] MUST mostrar subtotal por item y total general actualizado en tiempo real
- [ ] Los campos de la compra MUST incluir: fecha (default hoy), proveedor (texto libre), método de pago (EFECTIVO / TRANSFERENCIA), observaciones (opcional)
- [ ] Al confirmar el Paso 2, MUST:
  - Crear registro `Compra` con sus `CompraItem`
  - Incrementar `stockActual` de cada artículo
  - Hacer esto en una transacción atómica de Prisma
- [ ] MUST validar que todas las cantidades sean > 0
- [ ] MUST mostrar estado de carga durante el guardado
- [ ] Al guardar exitosamente, MUST cerrar el modal y refrescar el listado
- [ ] SHOULD tener botón "Cancelar" que cierra el modal sin guardar

### Technical Notes
- Modal con shadcn/ui Dialog
- Componente cliente con `"use client"`
- El modal recibe la lista de artículos como prop (cargada desde el listado padre)
- Server Action `registerPurchase` maneja la lógica transaccional
- Usar `prisma.$transaction` para asegurar atomicidad: crear Compra + CompraItems + actualizar stock
- Paso 1 y Paso 2 son sub-componentes del modal, el estado se mantiene en el modal padre

### Test Scenarios
1. **Compra simple**: 1 artículo, cantidad 10, proveedor "Frades" → stock se incrementa en 10
2. **Compra múltiple**: 3 artículos con cantidades diferentes → stock de cada uno se actualiza correctamente
3. **Validación cantidades**: dejar cantidad en 0 → error
4. **Cancelar compra**: cerrar modal sin confirmar → no se guarda nada, stock no cambia
5. **Proveedor libre**: escribir "Tucanas" como proveedor → se guarda correctamente

---

## 4. Historial de Inventario por Artículo

**File**: `app/(dashboard)/articulos/[id]/historial/page.tsx`

### Purpose
Vista detallada del historial de movimientos de un artículo: entradas (compras) y salidas (pedidos entregados). Timeline de todos los cambios de stock.

### Acceptance Criteria
- [ ] MUST mostrar el nombre del artículo como título de la página
- [ ] MUST mostrar el stock actual del artículo como resumen
- [ ] MUST listar todos los movimientos en orden cronológico descendente
- [ ] Cada movimiento MUST mostrar: fecha, tipo (entrada/salida), cantidad, referencia (número de compra o pedido), y responsable
- [ ] Las entradas (compras) MUST tener indicador visual verde
- [ ] Las salidas (pedidos) MUST tener indicador visual rojo
- [ ] MUST distinguir visualmente entre compras y pedidos
- [ ] SHOULD mostrar el stock resultante después de cada movimiento
- [ ] SHOULD tener enlace a la compra o pedido que originó el movimiento

### Technical Notes
- Ruta dinámica de Next.js: `app/(dashboard)/articulos/[id]/historial/page.tsx`
- Server Component que obtiene datos con Server Action
- Timeline con Tailwind: bordes laterales, dots en cada movimiento
- Datos combinados de `CompraItem` (entradas) y `PedidoItem` (salidas de pedidos ENTREGADOS)
- Para pedidos, solo incluir items de pedidos con estado `ENTREGADO`

### Test Scenarios
1. **Artículo sin movimientos**: el historial muestra "Sin movimientos registrados"
2. **Artículo con compras**: se listan entradas con badge verde y referencia a la compra
3. **Artículo con pedidos entregados**: se listan salidas con badge rojo y referencia al pedido
4. **Artículo con compras y pedidos**: timeline mixto ordenado por fecha

---

## 5. Server Actions y Servicios

**File**: `app/(dashboard)/articulos/actions.ts` + `lib/services/articulos.ts`

### Purpose
Capa de lógica de negocio para el módulo de artículos. Server Actions para operaciones CRUD y servicios Prisma encapsulados para lógica compleja.

### Acceptance Criteria
- [ ] `getArticulos(filtros?)` MUST retornar lista de artículos con filtros opcionales (categoría, presentación, búsqueda por nombre, activo/inactivo)
- [ ] `getArticuloById(id)` MUST retornar un artículo por ID
- [ ] `createArticulo(data)` MUST validar con Zod y crear un nuevo artículo
- [ ] `updateArticulo(id, data)` MUST validar con Zod y actualizar un artículo existente
- [ ] `deleteArticulo(id)` MUST hacer soft delete (setear `activo: false`)
- [ ] `registerPurchase(data)` MUST:
  - Validar con Zod
  - Crear Compra con sus CompraItem en una transacción
  - Incrementar `stockActual` de cada artículo
  - Retornar la compra creada
- [ ] `getHistorialArticulo(id)` MUST retornar entradas (compras) y salidas (pedidos ENTREGADOS) combinadas y ordenadas por fecha
- [ ] TODOS los Server Actions MUST capturar errores y retornar `{ error: string }` en caso de fallo
- [ ] TODOS los Server Actions MUST usar `"use server"` directive

### Technical Notes
- Separar lógica de base de datos en `lib/services/articulos.ts`
- Los servicios Prisma son funciones puras que reciben el PrismaClient
- Las validaciones Zod están en `lib/validations/articulos.ts` y se reutilizan en cliente y servidor
- `registerPurchase` usa `prisma.$transaction` para atomicidad

---

## 6. Validaciones Zod

**File**: `lib/validations/articulos.ts`

### Purpose
Esquemas de validación compartidos entre cliente y servidor para el módulo de artículos.

### Acceptance Criteria
- [ ] `articuloSchema` MUST validar: nombre (string, 1-100 chars), categoria (enum), presentacion (enum), costo (int positivo), precio (int positivo, > costo), stockMinimo (int >= 0)
- [ ] `createArticuloSchema` MUST ser un refine que verifique precio > costo
- [ ] `updateArticuloSchema` MUST ser igual pero con campos opcionales parciales
- [ ] `registerPurchaseSchema` MUST validar: fecha, proveedor (string, 1-200 chars), metodoPago (enum), items (array de { articuloId, cantidad, costo, subtotal }, min 1 item), observaciones (string opcional)
- [ ] `createArticuloSchema` y `updateArticuloSchema` MUST tener output types (`z.output<>`) para tipado
- [ ] `registerPurchaseSchema` MUST tener output type para la data de compra

### Technical Notes
- Usar `z.enum()` para categoría y presentación (coincidir con los enums de Prisma)
- Los `z.output<>` se usan para tipar los parámetros de Server Actions
- Precio: validar que `precio > costo` con `.refine()`
- Los montos COP son `z.number().int().positive()`

---

## Non-Functional Requirements

- **Client-side filtering**: la búsqueda y filtros en el catálogo operan del lado del cliente con los datos precargados. Si hay más de 100 artículos, implementar paginación server-side.
- **Debounce**: la búsqueda por nombre en el catálogo y en el modal de compras MUST usar debounce de 300ms para evitar re-renders excesivos.
- **Atomicidad**: todas las operaciones que afectan stock (registerPurchase, y en futuro: entregar/cancelar pedido) MUST usar transacciones de Prisma.
- **Responsive**: grilla en mobile (<768px), tabla en desktop (≥768px). Los formularios y modales MUST ser full-screen en mobile y centered dialog en desktop.
- **COP formatting**: todos los montos MUST mostrarse en formato COP: `$1.500.000` (sin decimales, con separador de miles).
- **Error handling**: los Server Actions MUST retornar `{ error: "mensaje" }` o `{ data: ... }` consistentemente. El cliente MUST mostrar errores sin perder datos del formulario.
