# Design: Mejora Gestión de Pedidos

---

## 1. Responsive PedidoDetail

### Problema
El componente `PedidoDetail.tsx` usa `<Table>` de shadcn dentro de un contenedor con `max-w-2xl`. En mobile (< 640px), la tabla tiene columnas fijas (Artículo, Cant., Precio Unit., Subtotal) que suman más ancho que el viewport.

### Solución

**Mobile-first**: Reemplazar `<Table>` con un layout de tarjetas verticales en mobile.

```
┌──────────────────────────────────┐
│ Papas Originales   G250          │
│ Cant: 2  ×  $2.500  =  $5.000   │
├──────────────────────────────────┤
│ Platanos Dulces    G65           │
│ Cant: 5  ×  $1.200  =  $6.000   │
├──────────────────────────────────┤
│ ...                              │
└──────────────────────────────────┘
```

**Desktop (sm:+)**: Mantener `<Table>` actual con `overflow-x-auto`.

### Cambios en `PedidoDetail.tsx`
- Envolver la tabla actual en `<div className="overflow-x-auto hidden sm:block">`
- Agregar bloque alternativo para mobile: `<div className="block sm:hidden space-y-3">` con items renderizados como cards
- Los totales quedan igual para ambos layouts
- No cambiar Cards de información ni timeline

---

## 2. Asignar/Editar Domiciliario

### Arquitectura
```
User click → Modal open → Select domiciliario → Confirm
                                                    ↓
                        Server Action (asignarDomiciliarioAction)
                                                    ↓
                        Service (asignarDomiciliario)
                                                    ↓
                        Prisma Transaction:
                          1. Update Pedido.domiciliarioId
                          2. Create HistorialEstado
                                                    ↓
                        RevalidatePath → router.refresh()
```

### Backend

**Service** (`lib/services/pedidos.ts`):

```typescript
export async function asignarDomiciliario(
  id: string,
  domiciliarioId: string | null,
  cambiadoPorId: string,
) {
  return db.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      include: { domiciliario: true },
    });

    // Validar estado permitido
    if (pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO") {
      throw new Error("No se puede cambiar el domiciliario de un pedido entregado o cancelado");
    }

    const domiciliarioAnterior = pedido.domiciliario?.nombre ?? null;

    // Obtener nombre del nuevo domiciliario si aplica
    let domiciliarioNuevoNombre = "Ninguno";
    if (domiciliarioId) {
      const nuevo = await tx.user.findUniqueOrThrow({
        where: { id: domiciliarioId },
        select: { nombre: true },
      });
      domiciliarioNuevoNombre = nuevo.nombre;
    }

    // Build motivo
    let motivo: string;
    if (domiciliarioAnterior) {
      motivo = `Domiciliario cambiado: ${domiciliarioAnterior} → ${domiciliarioNuevoNombre}`;
    } else {
      motivo = `Domiciliario asignado: ${domiciliarioNuevoNombre}`;
    }

    // Update pedido
    const updated = await tx.pedido.update({
      where: { id },
      data: { domiciliarioId: domiciliarioId ?? null },
      include: { cliente: true, domiciliario: true, items: true },
    });

    // Create historial
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: pedido.estado, // mismo estado
        cambiadoPorId,
        motivo,
      },
    });

    return updated;
  });
}
```

**Validation** (`lib/validations/pedidos.ts`):

```typescript
export const asignarDomiciliarioSchema = z.object({
  domiciliarioId: z.string().uuid().nullable(),
});

export type AsignarDomiciliarioInput = z.output<typeof asignarDomiciliarioSchema>;
```

**Server Action** (`actions.ts`):

```typescript
export async function asignarDomiciliarioAction(
  id: string,
  data: AsignarDomiciliarioInput,
): Promise<...> {
  // Validar sesión y rol Admin/SuperAdmin
  // Validar con Zod
  // Llamar service
  // RevalidatePath
}
```

### Frontend — PedidoDetail.tsx

Agregar al `Card` de Información del Pedido:

- Si el pedido está en `PENDIENTE` o `EN_CAMINO` AND user es Admin → mostrar botón "Cambiar domiciliario"
- Al hacer clic → modal con `<SelectRoot>` de domiciliarios (reutilizar lógica de PedidoForm)
- Opción "Sin domiciliario" incluida para pedidos que pueden desasignarse
- En `handleConfirm`: llamar server action, refrescar router

---

## 3. Factura con Logo

### Estrategia
El `LogoType` es un componente SVG inline que se renderiza en el DOM de la página de impresión. En pantalla (preview) se ve en color. En impresión, se aplica `print-color-adjust: exact` para preservar los colores del logo.

### Cambios en `page.tsx` (imprimir)

```tsx
import { LogoType } from "@/components/logo/logotype";

// En el print-header, reemplazar:
// <p class="print-brand">Envichips</p>
// <p class="print-brand-sub">Distribución de Snacks</p>
// Por:
<div className="print-logo">
  <LogoType className="print-logo-svg" />
</div>
<p className="print-brand-sub">Distribución de Snacks</p>
```

### Cambios en `print.css`

Agregar estilos para cada formato:

```css
/* Base (aplica a todos los formatos en print) */
.print-logo {
  text-align: center;
  margin-bottom: 2mm;
}

.print-logo-svg {
  display: inline-block;
  height: auto;
}

/* 58mm */
@media print and (max-width: 56mm) {
  .print-logo-svg {
    width: 40mm;
  }
}

/* 80mm */
@media print and (min-width: 57mm) and (max-width: 76mm) {
  .print-logo-svg {
    width: 60mm;
  }
}

/* A4 */
@media print and (min-width: 77mm) {
  .print-logo-svg {
    width: 120mm;
  }
}
```

### Consideraciones de color
- El `print.css` actual fuerza `* { color: #000 !important; background: transparent !important; }`
- Para el logo, necesitamos `print-color-adjust: exact` en el contenedor del logo
- Agregar `.print-logo, .print-logo * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`
- El SVG tiene fill inline (`#e35841`, `#522f0f`, etc.) — esos colores deben preservarse

---

## Estrategia de PRs Encadenados

### PR1: Responsive PedidoDetail
- **Archivos**: `components/pedidos/PedidoDetail.tsx`
- **Líneas estimadas**: ~60-80

### PR2: Asignar domiciliario
- **Archivos**: `lib/services/pedidos.ts`, `lib/validations/pedidos.ts`, `app/(dashboard)/pedidos/actions.ts`, `components/pedidos/PedidoDetail.tsx`
- **Líneas estimadas**: ~180-220

### PR3: Factura con logo
- **Archivos**: `app/(dashboard)/pedidos/[id]/imprimir/page.tsx`, `app/(dashboard)/pedidos/[id]/imprimir/print.css`
- **Líneas estimadas**: ~100-140

**Total estimado**: ~340-440 líneas (marginal respecto al budget de 400)
