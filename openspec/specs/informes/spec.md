# Specs: Fase 5 — Informes

> Envichips SaaS · Especificaciones detalladas
> Basado en PRD v1.1 — Módulo: Informes (Sección 9)

---

## 1. Resumen del Día (Dashboard)

**File**: `app/dashboard/informes/page.tsx`

### Purpose
Panel principal de métricas operativas del día. Consolida ventas, ganancias, pedidos, alertas de stock y cartera en cards de lectura rápida. Sirve como punto de entrada a los sub-reportes detallados.

### Acceptance Criteria
- [ ] MUST mostrar las siguientes métricas como cards con valor numérico y descripción:
  - Ventas del día: `Σ Pedido.total WHERE fecha >= startOfDay(today) AND estado = ENTREGADO`
  - Ganancia del día: `Σ PedidoItem.ganancia WHERE pedido.estado = ENTREGADO AND pedido.fecha >= startOfDay(today)`
  - Pedidos entregados: `COUNT Pedido WHERE estado = ENTREGADO AND fecha >= startOfDay(today)`
  - Pedidos pendientes: `COUNT Pedido WHERE estado IN (PENDIENTE, EN_CAMINO)`
  - Productos con stock bajo: `COUNT Articulo WHERE stockActual <= stockMinimo AND stockActual > 0`, con lista rápida de nombres
  - Productos sin stock: `COUNT Articulo WHERE stockActual = 0`, con lista rápida
  - Clientes en deuda: `COUNT Cliente WHERE estado = EN_DEUDA`
  - Total a cobrar: `Σ getDeudaCliente(clienteId) WHERE cliente.estado = EN_DEUDA`
- [ ] Cada card MUST mostrar el valor numérico en formato COP (moneda) o entero (conteo) según corresponda
- [ ] Las cards de alerta (stock bajo, sin stock, clientes en deuda) MUST tener color distintivo (amarillo/rojo)
- [ ] MUST incluir filtros globales: rango de fechas (hoy/semana/mes) y domiciliario (todos/individual)
- [ ] MUST incluir navegación a sub-páginas de reportes detallados: Ventas, Inventario, Caja, Ganancias, Domiciliarios
- [ ] SHOULD mostrar skeleton loading mientras se cargan las queries
- [ ] MAY mostrar indicador de última actualización (timestamp)

### Technical Notes
- Server Component con Server Actions para cada query agregada
- Usar `date-fns`: `startOfDay()`, `endOfDay()`, `subDays()`, `startOfWeek()`, `endOfMonth()`
- Queries de solo lectura en `lib/services/informes.ts`
- `formatCOP()` de `lib/format.ts` para valores monetarios
- Cards con shadcn/ui `Card`, `CardHeader`, `CardContent`
- Para total a cobrar: ejecutar `getDeudaCliente()` en paralelo con `Promise.all()`

### Test Scenarios
1. **Métricas correctas con datos del día**: crear 3 pedidos ENTREGADO hoy, 2 PENDIENTES, 1 artículo con stock bajo, 1 cliente EN_DEUDA → resumen muestra ventas = suma de totales, pendientes = 2, stock bajo = 1, clientes en deuda = 1
2. **Día sin actividad**: sin pedidos, sin stock bajo, sin deudas → todas las métricas en 0 o "Sin datos"
3. **Filtro por domiciliario**: seleccionar domiciliario específico → métricas filtradas SOLO a pedidos de ese domiciliario
4. **Filtro semanal**: cambiar filtro a "Esta semana" → métricas calculadas desde startOfWeek(today)
5. **Navegación a sub-reporte**: click en card de Ventas → navega a `/dashboard/informes/ventas`
6. **Stock bajo con lista**: 3 artículos con stock bajo → card muestra conteo "3" y lista expandible con nombres

---

## 2. Informe de Ventas

**File**: `app/dashboard/informes/ventas/page.tsx` + `components/informes/VentasTable.tsx`

### Purpose
Desglose de ventas por producto del período seleccionado. Muestra unidades vendidas, ingresos, ganancia y participación porcentual. Incluye top 10 visual con barras CSS.

### Acceptance Criteria
- [ ] MUST mostrar tabla con columnas: producto (nombre + presentación), unidades vendidas, ingresos (COP), ganancia (COP), % del total de ventas
- [ ] MUST agrupar por `PedidoItem.articuloId` usando `prisma.pedidoItem.groupBy`
- [ ] MUST sumar `cantidad` (unidades), `subtotal` (ingresos) y `ganancia` por artículo
- [ ] MUST ordenar por unidades vendidas descendente
- [ ] MUST calcular `% del total` como `(ingresosProducto / ingresosTotales) × 100`
- [ ] MUST mostrar resumen del período: total vendido, total ganancia, producto más vendido, producto más rentable
- [ ] MUST incluir gráfico de barras horizontal (CSS puro) para top 10 productos por ingreso
- [ ] La barra MUST usar `width: (ingreso / maxIngreso) × 100%` con color Tailwind (ej: `bg-blue-500`)
- [ ] MUST filtrar por domiciliario si se selecciona en filtros globales
- [ ] SHOULD mostrar filtro de rango de fechas (hoy/semana/mes)
- [ ] SHOULD mostrar mensaje "No hay ventas en este período" cuando no hay datos

### Technical Notes
- Usar `prisma.pedidoItem.groupBy` con `by: ['articuloId']`, `_sum: { cantidad, subtotal, ganancia }`
- Joinear con `Articulo` para obtener nombre y presentación
- Bar chart: div contenedor con `w-full bg-gray-100 rounded`, div interno con `bg-blue-500 h-4 rounded` y `style={{ width: "${pct}%" }}`
- Memorizar cálculos de porcentaje con `useMemo`

### Test Scenarios
1. **Ventas con múltiples productos**: 3 pedidos ENTREGADO con 5 artículos diferentes → tabla muestra 5 filas ordenadas por unidades descendente
2. **Período sin ventas**: sin pedidos ENTREGADO en el período → mensaje "No hay ventas en este período"
3. **Top 10 barras**: 12 productos vendidos → solo top 10 aparecen en gráfico de barras
4. **Cálculo de % correcto**: producto con $50.000 de $200.000 totales → % = 25%
5. **Filtro por domiciliario**: seleccionar domiciliario → tabla muestra SOLO ventas de ese domiciliario

---

## 3. Informe de Inventario

**File**: `app/dashboard/informes/inventario/page.tsx` + `components/informes/InventarioTable.tsx`

### Purpose
Visibilidad completa del inventario: stock actual, ingresos/egresos del período, valorización y alertas. Reemplaza el control manual de existencias.

### Acceptance Criteria
- [ ] MUST mostrar tabla con columnas: producto, ingresos (unidades compradas), egresos (unidades vendidas ENTREGADOS), stock actual, stock mínimo, estado (badge), valor inventario (COP)
- [ ] `ingresos` MUST ser `Σ CompraItem.cantidad WHERE compra.fecha IN período`
- [ ] `egresos` MUST ser `Σ PedidoItem.cantidad WHERE pedido.estado = ENTREGADO AND pedido.fecha IN período`
- [ ] `stockActual` MUST venir de `Articulo.stockActual` (valor actual, no del período)
- [ ] `stockMinimo` MUST venir de `Articulo.stockMinimo`
- [ ] `estado` MUST ser badge con color:
  - Stock OK (verde) cuando `stockActual >= stockMinimo`
  - Stock Bajo (amarillo) cuando `stockActual > 0 AND stockActual < stockMinimo`
  - Sin Stock (rojo) cuando `stockActual = 0`
- [ ] `valor inventario` MUST ser `stockActual × costo` por artículo
- [ ] MUST mostrar resumen: total unidades en inventario (`Σ stockActual`), valor total inventario (`Σ stockActual × costo`), lista de productos agotados (`stockActual = 0`)
- [ ] SHOULD mostrar filtro de rango de fechas para ingresos/egresos
- [ ] SHOULD permitir ordenar por cualquier columna

### Technical Notes
- Tres queries separadas: `Articulo.findMany` (stock actual), `CompraItem` aggregate (ingresos), `PedidoItem` aggregate (egresos)
- Joinear resultados en memoria por `articuloId`
- Valor inventario calculado en cliente: `stockActual * costo`
- Lista de agotados: `Articulo.findMany({ where: { stockActual: 0, activo: true } })`

### Test Scenarios
1. **Inventario completo**: 10 artículos con distintos stocks → tabla muestra todos con estado correcto
2. **Artículo sin stock**: artículo con stockActual = 0 → badge rojo "Sin Stock", aparece en lista de agotados
3. **Stock bajo**: artículo con stockActual = 3, stockMinimo = 5 → badge amarillo "Stock Bajo"
4. **Ingresos y egresos del período**: 2 compras y 3 pedidos ENTREGADO en el período → columnas ingresos/egresos reflejan sumas correctas
5. **Valor total inventario**: 3 artículos con stock 10, 20, 30 y costo $1000, $2000, $3000 → valor total = (10×1000 + 20×2000 + 30×3000) = $140.000
6. **Período sin ingresos ni egresos**: sin compras ni pedidos → ingresos = 0, egresos = 0

---

## 4. Informe de Ganancias

**File**: `app/dashboard/informes/ganancias/page.tsx` + `components/informes/GananciasCards.tsx`

### Purpose
Panel financiero de alto nivel. Visible exclusivamente para rol `SUPERADMIN`. Muestra ganancia bruta, costos, gastos operativos y ganancia neta del período.

### Acceptance Criteria
- [ ] MUST verificar `session.user.rol === "SUPERADMIN"` antes de renderizar cualquier contenido
- [ ] Si el rol NO es SUPERADMIN, MUST mostrar mensaje "Acceso restringido — Solo SuperAdmin" o redirigir
- [ ] MUST mostrar las siguientes métricas en cards:
  - Ganancia bruta: `Σ PedidoItem.ganancia WHERE pedido.estado = ENTREGADO AND pedido.fecha IN período`
  - Costo de ventas: `Σ PedidoItem.costo × PedidoItem.cantidad WHERE pedido.estado = ENTREGADO AND pedido.fecha IN período`
  - Gastos operativos: `Σ Movimiento.monto WHERE tipo = GASTO AND fecha IN período`
  - **Ganancia neta**: `Ganancia bruta - Gastos operativos`
- [ ] La ganancia neta MUST tener color distintivo: verde si positiva, rojo si negativa
- [ ] MUST incluir filtro de rango de fechas
- [ ] SHOULD mostrar comparativo vs período anterior (variación porcentual)
- [ ] SHOULD mostrar distribución de ganancias si configurada (porcentajes entre socios)

### Technical Notes
- Role gate en Server Component con `auth()` de NextAuth.js
- Gastos operativos: sumar solo `Movimiento` con `tipo = GASTO`, ignorar INGRESO y PRESTAMO
- Ganancia bruta y costo de ventas salen de `PedidoItem` en pedidos ENTREGADOS del período
- Para período anterior: `startOfDay(subDays(startOfPeriod, diffDays))`

### Test Scenarios
1. **SuperAdmin ve ganancias**: login como SUPERADMIN → todas las métricas visibles y correctas
2. **Admin no ve ganancias**: login como ADMIN → mensaje "Acceso restringido" o redirección
3. **Ganancias con datos**: 5 pedidos ENTREGADO con ganancia total $200.000, gastos $50.000 → ganancia neta = $150.000 (verde)
4. **Ganancia neta negativa**: ganancia bruta $50.000, gastos $80.000 → ganancia neta = -$30.000 (rojo)
5. **Período sin datos**: sin pedidos ENTREGADO ni gastos → todas las métricas en 0
6. **Comparativo vs período anterior**: período anterior: ganancia $100.000, actual: $150.000 → variación +50%

---

## 5. Informe de Domiciliarios

**File**: `app/dashboard/informes/domiciliarios/page.tsx` + `components/informes/DomiciliariosTable.tsx`

### Purpose
Rendimiento individual de cada domiciliario en el período. Muestra pedidos entregados, total vendido, métodos de cobro y cancelaciones.

### Acceptance Criteria
- [ ] MUST mostrar tabla con columnas: domiciliario (nombre), pedidos entregados (cantidad), total vendido (COP), efectivo recolectado (COP), transferencias (COP), pedidos cancelados (cantidad)
- [ ] MUST agrupar por `Pedido.domiciliarioId` usando `prisma.pedido.groupBy`
- [ ] `pedidos entregados` MUST ser `COUNT WHERE estado = ENTREGADO`
- [ ] `total vendido` MUST ser `Σ total WHERE estado = ENTREGADO`
- [ ] `efectivo recolectado` MUST ser `Σ total WHERE estado = ENTREGADO AND metodoPago = EFECTIVO`
- [ ] `transferencias` MUST ser `Σ total WHERE estado = ENTREGADO AND metodoPago = TRANSFERENCIA`
- [ ] `pedidos cancelados` MUST ser `COUNT WHERE estado = CANCELADO`
- [ ] MUST ordenar por pedidos entregados descendente
- [ ] MUST incluir filtro de rango de fechas
- [ ] SHOULD incluir gráfico de barras CSS para top 5 domiciliarios por total vendido
- [ ] SHOULD mostrar totales generales al pie de la tabla

### Technical Notes
- Usar `prisma.pedido.groupBy` con `by: ['domiciliarioId']`, `_count: { id: true }`, `_sum: { total: true }`
- Joinear con `User` para obtener nombre del domiciliario
- Dos groupBy: uno para ENTREGADO y otro para CANCELADO, combinar en memoria
- Efectivo vs transferencia: filtrar por `metodoPago` en el where del groupBy o calcular en cliente

### Test Scenarios
1. **Rendimiento de múltiples domiciliarios**: 3 domiciliarios con distinta cantidad de pedidos → tabla ordenada por entregados descendente
2. **Domiciliario sin actividad**: domiciliario sin pedidos en el período → no aparece en la tabla (solo domiciliarios con actividad)
3. **Cobros mixtos**: domiciliario con 3 entregas EFECTIVO ($30.000) y 2 TRANSFERENCIA ($20.000) → efectivo = $30.000, transferencias = $20.000
4. **Período sin entregas ni cancelaciones**: sin pedidos en el período → tabla vacía, mensaje "Sin actividad de domiciliarios"
5. **Filtro semanal**: cambiar filtro a "Esta semana" → datos filtrados correctamente

---

## 6. Server Actions

**File**: `app/dashboard/informes/actions.ts`

### Purpose
Capa de Server Actions para consultas agregadas de informes. Sigue el patrón de `pedidos/actions.ts`.

### Acceptance Criteria
- [ ] `getResumenAction(filtros?)` MUST retornar objeto con: ventasHoy, gananciaHoy, pedidosEntregados, pedidosPendientes, productosStockBajo (count + lista), clientesEnDeuda (count), totalACobrar
- [ ] `getVentasAction(filtros?)` MUST retornar lista agrupada por producto con: articulo, unidades, ingresos, ganancia, porcentaje + totales del período
- [ ] `getInventarioAction(filtros?)` MUST retornar lista de artículos con: ingresos (compras), egresos (ventas), stockActual, stockMinimo, estado, valorInventario + resumen (total unidades, valor total, lista agotados)
- [ ] `getGananciasAction(filtros?)` MUST retornar: gananciaBruta, costoVentas, gastosOperativos, gananciaNeta + comparativo período anterior
- [ ] `getDomiciliariosAction(filtros?)` MUST retornar lista agrupada por domiciliario con: nombre, entregados, totalVendido, efectivo, transferencias, cancelados + totales generales
- [ ] TODOS los Server Actions MUST verificar que el usuario esté autenticado (`auth()`)
- [ ] `getGananciasAction` MUST además verificar `session.user.rol === "SUPERADMIN"`
- [ ] TODOS los Server Actions MUST capturar errores y retornar `{ error: string }` en caso de fallo
- [ ] TODOS los Server Actions MUST usar `"use server"` directive

### Technical Notes
- Lógica de BD delegada a `lib/services/informes.ts`
- Filtros: `{ rango: 'hoy' | 'semana' | 'mes', domiciliarioId?: string }`
- Calcular fechas con `date-fns` antes de pasar al servicio

---

## 7. Validaciones Zod

**File**: `lib/validations/informes.ts`

### Purpose
Esquemas de validación para filtros de informes y acciones relacionadas.

### Acceptance Criteria
- [ ] `filtrosInformesSchema` MUST validar: rango (z.enum(['hoy', 'semana', 'mes', 'personalizado'])), domiciliarioId (uuid opcional), fechaInicio (date opcional), fechaFin (date opcional)
- [ ] `filtrosPersonalizadosSchema` MUST refinar: si rango = 'personalizado', fechaInicio y fechaFin MUST ser requeridos
- [ ] MUST tener output types: `FiltrosInformesInput`

### Technical Notes
- Usar `z.discriminatedUnion` o `z.refine` para validación condicional de fechas
- Reutilizar en cliente y servidor

---

## 8. Control de Acceso por Rol

### Page gate por rol

El servidor componente de `/informes` y todos sus sub-reportes (`/ventas`, `/inventario`, `/caja`, `/domiciliarios`) MUST verificar `roleGte(user, "ADMIN")`. DOMICILIARIO MUST ser redirigido a `/no-autorizado`.

#### Scenario: Admin accede a informes

- GIVEN usuario ADMIN autenticado
- WHEN navega a `/informes`
- THEN ve el resumen del día completo

#### Scenario: Domiciliario redirigido

- GIVEN usuario DOMICILIARIO autenticado
- WHEN navega a `/informes`
- THEN es redirigido a `/no-autorizado`

### Server action guards

TODOS los server actions de informes (`getResumenAction`, `getVentasAction`, `getInventarioAction`, `getDomiciliariosAction`) MUST verificar `roleGte(user, "ADMIN")`. `getGananciasAction` MUST mantener su verificación de SUPERADMIN.

#### Scenario: Admin consulta resumen

- GIVEN usuario ADMIN autenticado
- WHEN llama `getResumenAction`
- THEN retorna métricas del día

#### Scenario: Domiciliario no accede a datos

- GIVEN usuario DOMICILIARIO autenticado
- WHEN llama `getResumenAction`
- THEN retorna error de autorización

### Navegación oculta para DOMICILIARIO

Los links a Informes en sidebar y bottom-nav MUST ocultarse para rol DOMICILIARIO.

#### Scenario: Admin ve link a informes

- GIVEN usuario ADMIN en navegación
- THEN ve link a "Informes" en sidebar y bottom-nav

#### Scenario: Domiciliario no ve link

- GIVEN usuario DOMICILIARIO en navegación
- THEN NO ve link a "Informes"

---

## Non-Functional Requirements

- **COP formatting**: todos los montos en formato `$1.500.000` (sin decimales, separador de miles)
- **Error handling**: Server Actions retornan `{ error: "mensaje" }` o `{ data: ... }` consistentemente
- **Role checking**: `getGananciasAction` verifica rol SUPERADMIN
- **Performance**: queries agregadas con `groupBy` de Prisma, no carga todo en memoria
- **Responsive**: tablas con scroll horizontal en mobile, tabla completa en desktop
- **CSS bars**: sin librería externa, barras con `width: porcentaje%` y colores Tailwind
