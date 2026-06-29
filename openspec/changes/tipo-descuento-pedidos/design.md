# Diseño: Tipo de Descuento en Pedidos

## Enfoque Técnico

Agregar un selector excluyente de tipo de descuento (NINGUNO | GLOBAL | ESPECIAL) al Step 3 del wizard de pedidos. El modo ESPECIAL permite modificar el precio unitario por ítem sin alterar el precio de catálogo. La lógica de cálculo de totales cambia según el modo. Solo ADMIN/SUPERADMIN puede usar GLOBAL o ESPECIAL.

## Decisiones de Arquitectura

| Opción | Alternativa | Decisión |
|--------|-------------|----------|
| `tipoDescuento` como enum Prisma vs String | String es más flexible pero pierde type-safety en DB | **enum TipoDescuento** — mismo patrón que `EstadoPedido`, `MetodoPago` |
| `PedidoItem.precioOriginal` vs sobrescribir `precio` | Sobrescribir pierde el precio de referencia | **precioOriginal (nuevo)** + `precio` se mantiene como efectivo |
| `precioPersonalizado` en input vs `precioModificado` en item | Dos nombres para el mismo concepto | CartItem usa **`precioModificado`** (UI state), Zod usa **`precioPersonalizado`** (input validation) |
| Selector como radio vs segmented button | Ambos válidos | **Segmented button** — consistente con método de pago existente |

## Flujo de Datos

```
CartItem (frontend)
  ├── tipoDescuento = "ESPECIAL"
  ├── precioModificado = 4000  (ingresado por admin)
  └── precioOriginal = 5000    (snapshot Articulo.precio)

        │ createPedidoAction
        ▼

createPedidoSchema (Zod)
  ├── tipoDescuento → "ESPECIAL"
  └── items[].precioPersonalizado → 4000

        │ safeParse
        ▼

createPedido (service)
  ├── precioOriginal = articulo.precio     → DB
  ├── precio = precioPersonalizado ?? articulo.precio  → DB
  ├── descuento = 0 (ESPECIAL forza 0)
  ├── subtotal = Σ(cantidad × precio)
  └── total = subtotal (sin descuento adicional)

        │ Prisma tx
        ▼

DB: Pedido.tipoDescuento="ESPECIAL", PedidoItem.precioOriginal=5000, precio=4000
```

## Cambios en Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `prisma/schema.prisma` | Modificar | +enum TipoDescuento, +campo en Pedido, +campo en PedidoItem |
| `prisma/migrations/` | Crear | Nueva migración con backfill de datos existentes |
| `lib/validations/pedidos.ts` | Modificar | +`tipoDescuento`, +`precioPersonalizado` en schemas |
| `lib/services/pedidos.ts` | Modificar | Lógica condicional en `createPedido()` y `modificarPedido()` |
| `app/(dashboard)/pedidos/actions.ts` | Modificar | Tipos de entrada + validación FIADO usa precio efectivo |
| `components/pedidos/PedidoForm.tsx` | Modificar | Step 3: selector + inputs editables en ESPECIAL |
| `components/pedidos/PedidoDetail.tsx` | Modificar | Badge tipo, precios diferenciados, modal modifica precios |
| `app/(dashboard)/pedidos/[id]/imprimir/page.tsx` | Modificar | Badge + columna de precios modificados |

## Interfaces / Contratos

```prisma
enum TipoDescuento {
  NINGUNO
  GLOBAL
  ESPECIAL
}

model Pedido {
  // +1 campo
  tipoDescuento  TipoDescuento @default(NINGUNO)
  // descuento (Int @default(0)) — sin cambios, solo usado en GLOBAL
}

model PedidoItem {
  // +1 campo
  precioOriginal Int // snapshot de Articulo.precio
  // precio (Int) — sin cambios, precio efectivo
}
```

```typescript
// Validación — schemas extendidos
export const TipoDescuentoEnum = z.enum(["NINGUNO", "GLOBAL", "ESPECIAL"]);

export const PedidoItemInput = z.object({
  articuloId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precioPersonalizado: z.number().int().min(0).optional(), // solo ESPECIAL
});

export const createPedidoSchema = z.object({
  // ...campos existentes
  tipoDescuento: TipoDescuentoEnum.default("NINGUNO"),
  descuento: z.number().int().min(0).default(0).optional(),
});

// Validación servidor (en service):
// - ESPECIAL → descuento forza 0
// - GLOBAL → descuento >= 0
// - NINGUNO → descuento = 0
```

## Estrategia de Pruebas

| Capa | Qué probar | Enfoque |
|------|-----------|---------|
| Unit (manual) | Zod cross-field validation | Probar combinaciones tipoDescuento + descuento + precioPersonalizado |
| Integration (manual) | Crear pedido GLOBAL/ESPECIAL/NINGUNO | Verificar cálculos en DB |
| Visual | Step 3 selector condicional | Render condicional según rol |
| Regression | Flujo GLOBAL existente | Mismo comportamiento sin tipoDescuento |

## Migración / Rollout

Migración única con backfill de datos existentes:
- `Pedido.tipoDescuento = "GLOBAL"` si `descuento > 0`, si no `"NINGUNO"`
- `PedidoItem.precioOriginal = PedidoItem.precio` para todos los items

Rollback: revertir migración + eliminar campos del schema. La UI existente ignora `tipoDescuento` y `precioOriginal` (son additive).

## Preguntas Abiertas

- [ ] Ninguna — el diseño cubre todos los escenarios de spec y proposal
