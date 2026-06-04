# Specs: Fase 5 — Movimientos de Caja

> Envichips SaaS · Especificaciones detalladas
> Basado en PRD v1.1 — Módulo: Informes (Sección 9.6)

---

## 1. Crear Movimiento

**File**: `components/informes/CajaForm.tsx` + `app/dashboard/informes/caja/actions.ts`

### Purpose
Registro manual de movimientos de caja (ingresos, gastos, préstamos). Los movimientos automáticos (abonos de clientes, compras de mercancía) quedan para fases posteriores.

### Acceptance Criteria
- [ ] MUST permitir crear movimiento con los siguientes campos:
  - `tipo`: enum `INGRESO` · `GASTO` · `PRESTAMO` (Select)
  - `categoria`: enum `COMPRA_MERCANCIA` · `PAGO_DOMICILIARIO` · `ARRIENDO` · `SERVICIOS` · `COBRO_CARTERA` · `PRESTAMO` · `OTRO` (Select)
  - `monto`: número entero positivo en COP (Input number)
  - `descripcion`: texto libre (Input)
  - `metodoPago`: enum `EFECTIVO` · `TRANSFERENCIA` (Select)
  - `fecha`: DateTime, default `now()` (DatePicker opcional)
- [ ] MUST mostrar el formulario en un Dialog (shadcn/ui)
- [ ] MUST validar con Zod antes de enviar al servidor
- [ ] MUST mostrar estado de carga en el botón de guardar
- [ ] Al guardar exitosamente, MUST cerrar el Dialog y refrescar la lista
- [ ] MUST registrar `registradoPorId` con el ID del usuario autenticado (session.user.id)
- [ ] MUST capturar errores y mostrar toast con mensaje de error

### Technical Notes
- Componente cliente con `"use client"`
- Server Action `createMovimientoAction` en `app/dashboard/informes/caja/actions.ts`
- `registradoPorId` sin FK en schema (se consulta User aparte si es necesario)
- Fecha opcional: si no se provee, usar `new Date()`

### Test Scenarios
1. **Crear ingreso**: tipo=INGRESO, categoria=COBRO_CARTERA, monto=50000, descripcion="Abono cliente López", metodoPago=EFECTIVO → movimiento creado, lista actualizada
2. **Crear gasto**: tipo=GASTO, categoria=ARRIENDO, monto=300000, descripcion="Arriendo local junio", metodoPago=TRANSFERENCIA → movimiento creado
3. **Validación monto negativo**: monto=-1000 → error Zod "Debe ser un valor positivo"
4. **Validación campos requeridos**: enviar sin tipo → error Zod "Tipo es requerido"
5. **Error de servidor**: base de datos caída → toast con mensaje de error
6. **Usuario autenticado**: crear movimiento → registradoPorId = session.user.id

---

## 2. Listar Movimientos

**File**: `app/dashboard/informes/caja/page.tsx` + `components/informes/CajaTable.tsx`

### Purpose
Listado completo de movimientos de caja con filtros por tipo, categoría y rango de fechas. Incluye resumen de flujo neto y saldo actual.

### Acceptance Criteria
- [ ] MUST mostrar tabla con columnas: fecha, tipo (badge con color), categoría, monto (COP), descripción, método pago, registrado por
- [ ] MUST mostrar badge de tipo con color:
  - `INGRESO` → verde
  - `GASTO` → rojo
  - `PRESTAMO` → amarillo
- [ ] MUST incluir filtros: tipo (todos/INGRESO/GASTO/PRESTAMO), categoría (todas + cada categoría), rango de fechas (hoy/semana/mes/personalizado)
- [ ] MUST mostrar resumen del período filtrado:
  - Total ingresos: `Σ monto WHERE tipo = INGRESO`
  - Total gastos: `Σ monto WHERE tipo = GASTO`
  - **Flujo neto**: `Total ingresos - Total gastos`
- [ ] MUST mostrar saldo actual (historial completo):
  - `Σ monto WHERE tipo = INGRESO - Σ monto WHERE tipo = GASTO` (sin filtro de fecha)
- [ ] El flujo neto MUST tener color: verde si positivo, rojo si negativo
- [ ] MUST ordenar por fecha descendente
- [ ] SHOULD mostrar paginación (20 movimientos por página)

### Technical Notes
- Server Component con Server Action `getMovimientosAction(filtros?)`
- Saldo actual: query sin filtro de fecha, solo filtrar por tipo INGRESO y GASTO
- PRESTAMO no afecta saldo actual (es neutro, entra y sale)
- Tabla con shadcn/ui Table, scroll horizontal en mobile

### Test Scenarios
1. **Listado con movimientos mixtos**: 3 ingresos, 2 gastos, 1 préstamo → tabla muestra 6 filas ordenadas por fecha descendente
2. **Filtro por tipo**: seleccionar filtro GASTO → solo gastos visibles
3. **Filtro por categoría**: seleccionar ARRIENDO → solo gastos de arriendo
4. **Flujo neto positivo**: ingresos=$500.000, gastos=$200.000 → flujo neto=$300.000 (verde)
5. **Flujo neto negativo**: ingresos=$100.000, gastos=$300.000 → flujo neto=-$200.000 (rojo)
6. **Saldo actual correcto**: historial: ingresos=$2.000.000, gastos=$1.200.000 → saldo actual=$800.000
7. **Período sin movimientos**: sin movimientos en el período seleccionado → mensaje "No hay movimientos"

---

## 3. Eliminar Movimiento (Soft-delete)

**File**: `app/dashboard/informes/caja/actions.ts`

### Purpose
Eliminación lógica de movimientos para mantener auditoría. Solo el SuperAdmin puede eliminar.

### Acceptance Criteria
- [ ] NO MUST permitir edición de movimientos existentes (audit trail)
- [ ] MUST permitir soft-delete (marcar como eliminado, no borrar de la BD)
- [ ] Solo SUPERADMIN MUST poder eliminar un movimiento
- [ ] Al eliminar, MUST solicitar confirmación (Dialog con "¿Estás seguro?")
- [ ] MUST requerir motivo de eliminación (string, min 10 caracteres)
- [ ] Al eliminar, MUST actualizar `creadoEn` o agregar campo `eliminadoEn` (según implementación)
- [ ] Los movimientos eliminados NO MUST aparecer en listados por defecto
- [ ] SHOULD haber un toggle "Mostrar eliminados" en el listado para SuperAdmin

### Technical Notes
- Soft-delete: agregar campo `eliminado BOOLEAN @default(false)` y `eliminadoEn DateTime?` y `eliminadoPorId String?` y `motivoEliminacion String?` al modelo Movimiento
- No se requiere migración de schema si se usa el campo `creadoEn` como soft-delete timestamp (pero mejor usar campo explícito)
- Server Action `deleteMovimientoAction(id, motivo)`

### Test Scenarios
1. **Soft-delete exitoso**: SuperAdmin elimina movimiento con motivo "Registro duplicado" → movimiento desaparece del listado
2. **Admin no puede eliminar**: Admin intenta eliminar → error "Solo SuperAdmin puede eliminar movimientos"
3. **Motivo inválido**: motivo muy corto ("No") → error Zod "El motivo debe tener al menos 10 caracteres"
4. **Ver eliminados**: SuperAdmin activa toggle "Mostrar eliminados" → movimientos borrados aparecen atenuados
5. **Integridad de saldo**: eliminar un gasto de $50.000 → saldo actual se recalcula correctamente

---

## 4. Server Actions

**File**: `app/dashboard/informes/caja/actions.ts`

### Purpose
Capa de Server Actions para CRUD de movimientos de caja.

### Acceptance Criteria
- [ ] `getMovimientosAction(filtros?)` MUST retornar lista de movimientos con filtros por tipo, categoría, fecha, más resumen (totalIngresos, totalGastos, flujoNeto) y saldoActual
- [ ] `createMovimientoAction(data)` MUST validar con Zod, crear movimiento con registradoPorId de session
- [ ] `deleteMovimientoAction(id, motivo)` MUST validar rol SUPERADMIN, validar motivo, marcar como eliminado
- [ ] TODOS los Server Actions MUST usar `"use server"` directive
- [ ] TODOS los Server Actions MUST verificar autenticación con `auth()`
- [ ] TODOS los Server Actions MUST capturar errores y retornar `{ error: string }` en caso de fallo
- [ ] En mutaciones exitosas, MUST llamar `revalidatePath("/dashboard/informes/caja")`

### Technical Notes
- Lógica de BD en `lib/services/movimientos.ts`
- Separar queries de lectura y mutaciones
- Saldo actual: query sin filtro de fecha

---

## 5. Validaciones Zod

**File**: `lib/validations/movimientos.ts`

### Purpose
Esquemas de validación para movimientos de caja.

### Acceptance Criteria
- [ ] `createMovimientoSchema` MUST validar: tipo (z.enum), categoria (z.enum), monto (z.number().int().positive()), descripcion (z.string().min(3).max(500)), metodoPago (z.enum), fecha (z.date().optional())
- [ ] `deleteMovimientoSchema` MUST validar: id (uuid), motivo (z.string().min(10).max(500))
- [ ] `filtrosMovimientosSchema` MUST validar: tipo (TipoMovimiento opcional), categoria (CategoriaMovimiento opcional), fechaInicio (date opcional), fechaFin (date opcional), incluidosEliminados (boolean opcional)
- [ ] MUST reutilizar enums de Prisma (`TipoMovimiento`, `CategoriaMovimiento`, `MetodoPago`)
- [ ] MUST tener output types: `CreateMovimientoInput`, `DeleteMovimientoInput`, `FiltrosMovimientosInput`

### Technical Notes
- Los enums se importan de `@prisma/client` o se definen en validaciones
- COP: `z.number().int().positive()` (monto mínimo 1)

---

## Non-Functional Requirements

- **COP formatting**: todos los montos en formato `$1.500.000` (sin decimales, separador de miles)
- **Error handling**: Server Actions retornan `{ error: "mensaje" }` o `{ data: ... }` consistentemente
- **Role checking**: `deleteMovimientoAction` verifica rol SUPERADMIN
- **Audit trail**: sin edición, solo soft-delete con motivo y timestamp
- **Saldo actual**: calculado desde el inicio del historial, sin límite de fecha
