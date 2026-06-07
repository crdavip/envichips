# Tasks: Mejora Gestión de Pedidos

> Basado en `proposal.md`, `spec.md`, `design.md`
> Review budget: 400 líneas | Delivery: force-chained (3 PRs)

---

## Review Workload Forecast

- **Decision needed before apply**: No (chained PRs pre-aprobados)
- **Chained PRs recommended**: Yes (3 PRs independientes)
- **400-line budget risk**: Medium (~340-440 líneas total)

---

## PR1 — Responsive PedidoDetail (60-80 líneas)

### Archivos
- `components/pedidos/PedidoDetail.tsx`

### Tasks

**T1.1**: Envolver la `<Table>` de items en un contenedor `overflow-x-auto hidden sm:block`
- Referencia: líneas 446-479 de PedidoDetail.tsx
- El table header + body van dentro de un div con esas clases

**T1.2**: Agregar layout mobile alternativo para items
- Usar `block sm:hidden` con `space-y-3`
- Cada item: card con nombre + presentación, cantidad/precio/subtotal en fila separada
- Matching visual con el diseño actual

**T1.3**: Verificar que los totales funcionan en ambos layouts
- Los totales (líneas 482-499) ya están fuera de la tabla, deben mantenerse igual

### Verification
- Abrir pedido en viewport < 640px → sin scroll horizontal
- Abrir pedido en viewport > 640px → tabla normal

---

## PR2 — Asignar/Editar Domiciliario (180-220 líneas)

### Archivos
- `lib/services/pedidos.ts`
- `lib/validations/pedidos.ts`
- `app/(dashboard)/pedidos/actions.ts`
- `components/pedidos/PedidoDetail.tsx`

### Tasks

**T2.1**: Agregar schema `asignarDomiciliarioSchema` en validations
- `domiciliarioId: z.string().uuid().nullable()`
- Exportar `AsignarDomiciliarioInput` type

**T2.2**: Agregar función `asignarDomiciliario` en services
- Transacción: validar estado (no ENTREGADO/CANCELADO), obtener nombres, update, crear historial
- Seguir el diseño definido

**T2.3**: Agregar server action `asignarDomiciliarioAction` en actions.ts
- Validar sesión + rol Admin/SuperAdmin
- Validar con Zod
- Llamar service
- RevalidatePath

**T2.4**: Agregar UI en PedidoDetail.tsx
- Botón "Cambiar domiciliario" si el pedido está PENDIENTE/EN_CAMINO y user es Admin
- Modal con Select de domiciliarios (reutilizando getDomiciliariosAction)
- Opción "Sin domiciliario"
- Confirmar → server action → router.refresh()

### Verification
- Admin ve botón en pedido PENDIENTE/EN_CAMINO
- Admin NO ve botón en pedido ENTREGADO/CANCELADO
- Domiciliario NO ve botón
- Asignar domiciliario cambia el valor y registra historial
- Cambiar domiciliario actualiza y registra historial con motivo correcto

---

## PR3 — Factura con Logo (100-140 líneas)

### Archivos
- `app/(dashboard)/pedidos/[id]/imprimir/page.tsx`
- `app/(dashboard)/pedidos/[id]/imprimir/print.css`

### Tasks

**T3.1**: Importar y renderizar `LogoType` en imprimir/page.tsx
- Importar de `@/components/logo/logotype`
- Reemplazar `<p class="print-brand">Envichips</p>` por el SVG
- Envolver en `<div className="print-logo">`
- Mantener texto "Distribución de Snacks"

**T3.2**: Agregar estilos del logo en print.css
- `.print-logo`: text-align center, margin-bottom
- `.print-logo-svg`: width responsive por formato (40mm/60mm/120mm), height auto
- `print-color-adjust: exact` en el contenedor del logo
- Excepción para que el logo NO herede `color: #000 !important` y `background: transparent !important`

**T3.3**: Mejorar espaciado y presentación general de la factura
- Asegurar que con el logo más grande, todo el contenido entre en una página
- Ajustar márgenes si es necesario

### Verification
- Vista previa en navegador muestra el logo
- Impresión en 58mm muestra logo legible
- Impresión en 80mm muestra logo proporcionado
- Impresión en A4 muestra logo completo
- Colores del logo se preservan en impresión
