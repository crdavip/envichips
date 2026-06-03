# Proposal: Fase 1 — Artículos

> Envichips SaaS · SDD Change

---

## Intent

Implementar el módulo completo de Artículos para permitir el catálogo de productos, control de inventario en tiempo real y registro de compras (entradas de inventario). Esta fase es fundamental porque sin el manejo correcto de artículos y stock, los módulos posteriores de Pedidos y Clientes no pueden funcionar correctamente. El dashboard ya tiene un enlace placeholder a `/dashboard/articulos` que actualmente 404, por lo que esta fase lo implementará completamente.

## Scope

### In Scope
- CRUD completo de artículos (crear, leer, actualizar, eliminar lógico)
- Catálogo de artículos con vista en grilla (mobile) y tabla (desktop)
- Filtros por categoría y presentación
- Búsqueda en tiempo real por nombre
- Indicadores visuales de stock bajo (Stock OK verde, Stock Bajo amarillo, Sin Stock rojo)
- Formulario de creación/edición con cálculo automático de ganancia y validación precio > costo
- Registro de compras (entradas de inventario) con actualización automática de stock
- Historial de inventario por artículo (entradas de compras y salidas de pedidos)
- Alertas de stock bajo en la UI

### Out of Scope
- Imágenes de productos (deferido a Fase de Usuarios o v1.5)
- Reportes avanzados de inventario (parte del módulo Informes, Fase 4)
- Integración con proveedores externos para compras automáticas
- Lotes o fechas de vencimiento de productos
- Transferencias entre almacenes (solo un almacén considerado inicialmente)

## Deliverables

| # | Deliverable | Archivo |
|---|-------------|---------|
| 1 | Página de listado de artículos | `app/(dashboard)/articulos/page.tsx` |
| 2 | Componentes de UI para artículos | `components/articulos/` |
| 3 | Server Actions para operaciones CRUD | `app/(dashboard)/articulos/actions.ts` |
| 4 | Formulario de creación/edición de artículos | `components/articulos/ArticleForm.tsx` |
| 5 | Modal para registro de compras | `components/articulos/PurchaseModal.tsx` |
| 6 | Vista de historial de inventario por artículo | `app/(dashboard)/articulos/[id]/historial/page.tsx` |
| 7 | Zod schemas para validación | `lib/validations/articulos.ts` |
| 8 | Actualización del seed con artículos de ejemplo | `prisma/seed.ts` |
| 9 | Prisma service para operaciones de artículos | `lib/services/articulos.ts` |

## Technical Approach

### Arquitectura General
- Siguiendo el patrón establecido en Fase 0: Server Actions para mutaciones, componentes shadcn/ui para UI
- Utilizar grupos de rutas `(dashboard)` para mantener el layout protegido
- Estado del lado cliente manejado con useState/useReducer (sin Zustand por simplicidad inicial)
- Validación en cliente y servidor con Zod

### Listado de Artículos (`app/(dashboard)/articulos/page.tsx`)
- Vista responsive: grilla en móvil (<768px), tabla en escritorio (≥768px)
- Filtros desplegables para categoría y presentación
- Input de búsqueda con debounce para filtrado en tiempo real
- Cada artículo muestra: nombre, precio, ganancia, stock actual, badge de estado
- Acciones inline: editar, inactivar/activar (soft delete)

### Componentes UI
- `ArticleCard.tsx`: tarjeta para vista móvil
- `ArticleRow.tsx`: fila para vista de tabla
- `StockBadge.jsx`: componente reutilizable para mostrar estado de stock
- `ArticleFilters.jsx`: componente con filtros de categoría/presentación y buscador

### Server Actions (`app/(dashboard)/articulos/actions.ts`)
- `getArticulos`: obtener lista con filtros y búsqueda
- `createArticulo`: crear nuevo artículo
- `updateArticulo`: actualizar artículo existente
- `deleteArticulo`: eliminar lógico (activo = false)
- `getArticuloById`: obtener artículo por ID para edición
- `registerPurchase`: registrar compra y actualizar stock

### Formulario de Artículo (`components/articulos/ArticleForm.tsx`)
- Campos: nombre, categoria, presentacion, costo, precio, stockMinimo
- Campo calculado de solo lectura: ganancia = precio - costo
- Validación en tiempo real: precio debe ser mayor que costo
- Envío mediante Server Action
- Estado de carga y manejo de errores

### Registro de Compras (`components/articulos/PurchaseModal.tsx`)
- Modal de 2 pasos conforme a PRD:
  Paso 1: Selección de artículos y cantidades (con buscador)
  Paso 2: Confirmación con totals, método de pago (EFECTIVO/TRANSFERENCIA), observaciones
- Al confirmar: crea registro Compra y CompraItem, actualiza stockActual de cada artículo
- Validación: cantidades deben ser positivas

### Historial de Inventario
- Ruta: `app/(dashboard)/articulos/[id]/historial/page.tsx`
- Muestra timeline de movimientos: entradas (compras) y salidas (pedidos)
- Para cada movimiento: fecha, tipo, cantidad, referencia (número de compra/pedido)
- Calcula stock acumulado a lo largo del tiempo

### Validaciones y Servicios
- Zod schemas en `lib/validations/articulos.ts` para crear/actualizar artículo y registrar compra
- Servicio en `lib/services/articulos.ts` que encapsula lógica de Prisma reutilizable
- Manejo de errores consistente con mensajes amigables para usuario

## Dependencies

| Paquete | Razón |
|---------|-------|
| `zod` | Validación de esquemas (ya instalado desde Fase 0) |
| `lucide-react` | Íconos para filtros, acciones y badges (ya instalado) |
| No se requieren nuevos paquetes | Todo el stack necesario ya está instalado |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Inconsistencia entre stockActual calculado y real | Media | Usar transacciones de Prisma para actualizaciones atómicas, validaciones en servidor |
| Sobrecarga de rendimiento en listado con muchos artículos | Baja | Implementar paginación o scroll infinito si supera 100 artículos, índices en DB |
| Errores en cálculo de ganancia redondeo | Baja | Usar enteros para COP (sin decimales) como ya está definido en Prisma |
| Flujo de compra confuso para usuarios | Media | Seguir exactamente el flujo de 2 pasos especificado en PRD, testing con usuarios reales |
| Conflictos de concurrencia al actualizar stock | Media | Usar transacciones y verificar versión o usar incrementos atómicos en Prisma |

## Estimated Effort

| Actividad | Esfuerzo |
|-----------|----------|
| Diseño de componentes UI y layout | 1 día |
| Server Actions y servicios de Prisma | 1 día |
| Formulario de artículo y validaciones | 0.5 día |
| Modal de registro de compras | 0.5 día |
| Vista de historial de inventario | 0.5 día |
| Integración y testing de flujos completos | 1 día |
| Ajustes de UI/UX y responsive | 0.5 día |
| **Total** | **5 días** |

---