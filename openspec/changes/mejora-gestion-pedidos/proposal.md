# Proposal: Mejora Gestión de Pedidos

## Intent

Resolver 3 problemas reportados en el módulo de pedidos: (1) scroll horizontal en mobile en el detalle del pedido, (2) imposibilidad de asignar/cambiar domiciliario después de crear el pedido, (3) factura impresa muy básica sin el logotipo de la empresa.

## Scope

### In Scope
- Refactor responsive del detalle del pedido para mobile
- Asignación y cambio de domiciliario en pedidos existentes (backend + frontend)
- Rediseño de la factura impresa con el logotipo completo de Envichips

### Out of Scope
- Cambios en el wizard de creación de pedidos (PedidoForm)
- Cambios en el listado de pedidos (PedidoList)
- Migraciones de base de datos (no se requieren)
- Soporte para múltiples domiciliarios por pedido

## Capabilities

### New Capabilities
- `asignacion-domiciliario`: Capacidad de asignar o cambiar el domiciliario de un pedido existente después de su creación

### Modified Capabilities
- `factura-impresion`: La factura impresa debe incluir el logotipo completo de la empresa con tamaño adecuado para cada formato de impresión (58mm, 80mm, A4)
- `pedidos`: El detalle del pedido debe ser responsive (sin scroll horizontal en mobile) y debe permitir asignar/cambiar domiciliario

## Approach

### Issue 1 — Responsive PedidoDetail
- Reemplazar `<Table>` de shadcn por un layout de lista vertical en mobile (< 640px) usando `<div>` con flex
- Mantener `<Table>` en desktop (sm:+) con overflow-x-auto wrapper
- Ajustar padding/márgenes del contenedor `max-w-2xl` para evitar desbordes

### Issue 2 — Asignar domiciliario
- Nueva función `asignarDomiciliario(id, domiciliarioId, cambiadoPorId)` en `lib/services/pedidos.ts`
- Nuevo schema `asignarDomiciliarioSchema` en `lib/validations/pedidos.ts`
- Nueva server action `asignarDomiciliarioAction` en actions.ts
- UI en PedidoDetail: botón "Cambiar domiciliario" → modal con selector de domiciliarios (reutilizando Select de shadcn)
- Solo visible para Admin/SuperAdmin

### Issue 3 — Factura con logo
- Importar `LogoType` SVG en la page de impresión
- Mostrarlo en el encabezado con tamaño proporcional
- En térmica 58mm: versión reducida (solo isologo o más pequeño)
- En térmica 80mm: tamaño moderado
- En A4: tamaño completo

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/pedidos/PedidoDetail.tsx` | Modified | Responsive fix + UI para cambiar domiciliario |
| `lib/services/pedidos.ts` | Modified | Nueva función `asignarDomiciliario` |
| `lib/validations/pedidos.ts` | Modified | Nuevo schema `asignarDomiciliarioSchema` |
| `app/(dashboard)/pedidos/actions.ts` | Modified | Nueva server action `asignarDomiciliarioAction` |
| `app/(dashboard)/pedidos/[id]/imprimir/page.tsx` | Modified | Logo en factura + layout mejorado |
| `app/(dashboard)/pedidos/[id]/imprimir/print.css` | Modified | Estilos para el logo en cada formato |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Logo SVG no se renderiza bien en impresión térmica (blanco y negro) | Medium | El CSS de impresión fuerza `color: #000`, el logo tiene colores definidos inline — usar `print-color-adjust: exact` |
| Domiciliario en medio de una transición de estado | Low | Validar que el pedido no esté ENTREGADO ni CANCELADO antes de permitir el cambio |
| 400-line budget excedido por los 3 cambios juntos | Medium | Dividir en 3 PRs encadenados: (1) responsive, (2) domiciliario, (3) factura |

## Rollback Plan

Por PR encadenado:
- **PR1 (responsive)**: Revertir cambios en PedidoDetail.tsx
- **PR2 (domiciliario)**: Revertir service + validation + action + UI changes
- **PR3 (factura)**: Revertir imprimir/page.tsx + print.css

Cada PR es independiente y puede revertirse sin afectar a los demás.

## Dependencies

- Ninguna. Todos los cambios son sobre archivos existentes sin nuevas dependencias externas.

## Success Criteria

- [ ] PedidoDetail no tiene scroll horizontal en viewports < 640px
- [ ] Admin puede asignar domiciliario a pedido existente desde el detalle
- [ ] Admin puede cambiar domiciliario de pedido existente
- [ ] La factura impresa muestra el logotipo de Envichips correctamente
- [ ] El logo se ve bien en los 3 formatos (58mm, 80mm, A4)
- [ ] No hay cambios en el wizard de creación ni en el listado
