# Design: Fase 2 — Pedidos

> Envichips SaaS · Diseño técnico
> Basado en PRD v1.1 sección 7 y proposal.md

---

## Technical Approach

Implementar el módulo de Pedidos siguiendo el mismo patrón arquitectónico de Fase 1 Artículos: **Server Actions → Prisma Services → Zod Validations → Componentes cliente**. Sin cambios de schema (modelos ya existen en Prisma).

---

## Architecture Decisions

### D1. Generación de numeroPedido

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Counter table (Sequence) | + Reseteo anual explícito, + Consulta simple, - Tabla adicional | ✅ **Elegido** |
| MAX() + 1 por año | - Race condition sin transacción, + Sin tabla extra | ❌ Riesgo de colisión |
| UUID + formato display | + Sin estado compartido, + Más complejo | ❌ Overkill |

**Decisión**: Crear tabla `Sequence` con campos `(año, tipo, contador)`. Para pedidos: `tipo="PEDIDO"`, formato `ENV-{año}-{contador padded 5}`. Incremento atómico con `prisma.$transaction`.

### D2. Estado del wizard de creación

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| URL params (`?step=1`) | + Shareable, + Browser back, - Estado efímero | ✅ **Elegido** |
| React state en padre | + Simple, - Se pierde al recargar | ❌ Mala UX en mobile |
| Zustand/Context global | + Persistente, - Overkill para un wizard local | ❌ |

**Decisión**: URL search params para el paso actual, estado del formulario (items seleccionados, cliente) en estado local del componente. Al cambiar de paso via `router.push` con los params.

### D3. Descuento de inventario

**Decisión**: Solo al alcanzar estado `ENTREGADO`. Usar `prisma.$transaction` que incluye:
1. Actualizar `Pedido.estado`
2. Crear `HistorialEstado`
3. Decrementar `Articulo.stockActual` por cada `PedidoItem.cantidad`
4. Si `metodoPago = FIADO`: incrementar `Cliente.deuda`

El descuento NO ocurre en `EN_CAMINO` ni en `PENDIENTE`.

### D4. Filtrado por rol

**Decisión**: El Server Action `getPedidosAction` recibe `userId` y `rol` del session. Si `rol = DOMICILIARIO`, filtra automáticamente por `domiciliarioId = userId` + fecha de hoy. Si `rol = ADMIN/SUPERADMIN`, aplica filtros opcionales del request.

### D5. Snapshots de precio/costo

**Decisión**: Al crear el pedido, se lee `Articulo.precio` y `Articulo.costo` actual y se guardan en `PedidoItem.precio` y `PedidoItem.costo`. Esto asegura que reportes históricos no se alteren si los precios cambian después.

---

## Data Flow

### Flujo: Crear Pedido

```
Usuario → PedidoForm (cliente)
  → Selecciona cliente (o escribe nombre venta rápida)
  → router.push("/dashboard/pedidos/create?step=2")

Usuario → PedidoForm (productos)
  → Busca artículos (debounce 300ms)
  → Agrega items con cantidad
  → router.push("/dashboard/pedidos/create?step=3")

Usuario → PedidoForm (resumen)
  → Ve total, descuento, método pago, domiciliario
  → Click "Confirmar"
    → createPedidoAction(data)
      → Zod validation
      → Service: createPedido()
        → prisma.$transaction:
          1. Sequence.increment("PEDIDO", año) → numeroPedido
          2. Read Articulo.precio + costo for each item
          3. Create Pedido + PedidoItems
          4. If domiciliarioId=null → estado=ENTREGADO
        → Return Pedido
    → revalidatePath("/dashboard/pedidos")
    → redirect("/dashboard/pedidos/[id]")
```

### Flujo: Transición a ENTREGADO (con cobro)

```
Usuario → Click "Marcar Entregado"
  → Modal: dineroCobrado? + montoCobrado
  → Confirma
    → updateEstadoAction(id, { estado: "ENTREGADO", dineroCobrado, montoCobrado })
      → Zod validation
      → Service: actualizarEstado()
        → prisma.$transaction:
          1. Read Pedido (items, metodoPago, clienteId)
          2. Validar transición permitida
          3. Update Pedido.estado = ENTREGADO
          4. For each PedidoItem: Articulo.stockActual -= cantidad
          5. If FIADO: Cliente.deuda += Pedido.total
          6. Create HistorialEstado
        → Return Pedido
    → revalidatePath
    → Refresh UI
```

### Flujo: Cancelación

```
Usuario → Click "Cancelar Pedido"
  → Modal: motivo (required)
  → Confirma
    → cancelarPedidoAction(id, motivo)
      → Zod validation
      → Service: cancelarPedido()
        → Validar estado actual (no ENTREGADO ni ya CANCELADO)
        → prisma.$transaction:
          1. Update Pedido.estado = CANCELADO
          2. Create HistorialEstado con motivo
          // No revertir stock porque solo se descuenta en ENTREGADO
        → Return Pedido
    → revalidatePath
    → Refresh UI
```

---

## File Changes

| File | Acción | Propósito |
|------|--------|-----------|
| `lib/validations/pedidos.ts` | Crear | Zod schemas: createPedido, updateEstado, confirmarCobro |
| `lib/services/pedidos.ts` | Crear | Service layer: getPedidos, createPedido, actualizarEstado, cancelarPedido, confirmarCobroAdmin, generarNumeroPedido |
| `app/dashboard/pedidos/actions.ts` | Crear | Server Actions con validación, auth y revalidation |
| `app/dashboard/pedidos/page.tsx` | Crear | Listado de pedidos con filtros (role-aware) |
| `app/dashboard/pedidos/create/page.tsx` | Crear | Página del wizard de 3 pasos |
| `app/dashboard/pedidos/[id]/page.tsx` | Crear | Detalle del pedido con timeline y acciones |
| `components/pedidos/PedidoForm.tsx` | Crear | Wizard component (3 pasos) |
| `components/pedidos/PedidoList.tsx` | Crear | List component con filtros y paginación |
| `components/pedidos/PedidoDetail.tsx` | Crear | Detail component con timeline y acciones |
| `components/pedidos/PedidoStatusBadge.tsx` | Crear | Badge de estado con colores |
| `prisma/schema.prisma` | Modificar | Agregar modelo `Sequence` para contador de numeroPedido |

---

## Interfaces / Contracts

```typescript
// lib/services/pedidos.ts
export interface PedidoFilters {
  estado?: EstadoPedido;
  domiciliarioId?: string;
  clienteId?: string;
  fechaDesde?: string;   // ISO date
  fechaHasta?: string;   // ISO date
  search?: string;       // numeroPedido or cliente
  page?: number;
  limit?: number;
}

export interface CreatePedidoData {
  clienteId?: string;
  clienteNombre?: string;  // venta rápida
  items: PedidoItemInput[];
  metodoPago: MetodoPago;
  descuento?: number;
  domiciliarioId?: string;  // null = venta directa
  observaciones?: string;
  creadoPorId: string;
}

export interface PedidoItemInput {
  articuloId: string;
  cantidad: number;
}

export interface UpdateEstadoData {
  estado: EstadoPedido;
  motivo?: string;          // required for CANCELADO
  dineroCobrado?: boolean;
  montoCobrado?: number;
  cambiadoPorId: string;
}
```

```prisma
// Add to prisma/schema.prisma
model Sequence {
  id        String @id @default(uuid())
  year      Int
  type      String // "PEDIDO"
  counter   Int    @default(0)

  @@unique([year, type])
}
```

---

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|-----------|------|
| Unit (services) | Lógica de transiciones, cálculo de totales, generación de numeroPedido | Tests con Prisma mock o transacciones en memoria |
| Integration | Flujo completo crear → entregar → cobrar, validación de stock | Pruebas con BD real (PostgreSQL local) |
| UI | Wizard de 3 pasos, visibilidad de botones por rol, filtros | Component testing con Testing Library |

---

## Migration / Rollout

**No se requiere migración de datos existentes**. Los modelos Pedido, PedidoItem, HistorialEstado ya existen en el schema. Solo agregar modelo `Sequence` para contadores.

**Orden de implementación sugerido**:
1. Schema: agregar modelo Sequence + migration
2. Validations: Zod schemas
3. Services: lógica de negocio
4. Server Actions: conectar servicios a la UI
5. Components: wizard, listado, detalle
6. Pages: rutas de Next.js

---

## Open Questions

- [ ] Seed data: ¿crear pedidos de ejemplo en el seed script o esperar a que el admin cree los primeros manualmente?
