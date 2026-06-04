# Proposal: Fase 3 — Factura e Impresión

## Intent

Implementar la funcionalidad de impresión de facturas para pedidos en el módulo de Pedidos, reemplazando el placeholder existente con una vista de impresión funcional que soporte impresoras térmicas (58mm y 80mm) y formato A4, según lo especificado en el PRD Sections 11 y 16. Esta funcionalidad permitirá a los usuarios generar facturas impresas directamente desde el detalle del pedido.

## Scope

### In Scope
- Reemplazar el placeholder en `app/dashboard/pedidos/[id]/imprimir/page.tsx` con una vista de impresión real
- Implementar CSS de impresión (@media print) para soportar impresoras térmicas de 58mm y 80mm, así como formato A4
- Configurar auto-trigger de window.print() al cargar la página de impresión
- Diseñar el layout de la factura según el PRD: encabezado de marca, información del pedido, tabla de ítems, totales, método de pago y pie de página
- Utilizar los datos ya disponibles en la interfaz PedidoData (numeroPedido, fecha, cliente, domiciliario, items, subtotal, descuento, total, metodoPago, observaciones)

### Out of Scope
- Cambios en la lógica de negocio del pedido (creación, estados, pagos)
- Modificaciones a la API o estructura de datos existente
- Implementación de funcionalidades de guardado o descarga de PDF (solo impresión directa)
- Cambios en otras rutas o componentes no relacionados con la impresión de facturas

## Capabilities

### New Capabilities
- `factura-impresion`: Capacidad para generar y imprimir facturas de pedidos con formato adecuado para térmicas y A4

### Modified Capabilities
- `pedidos`: Se modifica la capacidad existente para incluir la funcionalidad de impresión en el detalle del pedido (se agrega el comportamiento de navegación a la vista de impresión funcional)

## Approach

Reutilizar los datos ya disponibles en el componente PedidoDetail y crear una nueva página de impresión que:
1. Obtenga el pedido completo usando getPedidoByIdAction (similar al detalle)
2. Presente la información en un formato optimizado para impresión
3. Incluya CSS específico para @media print que ajuste el layout según el tipo de impresora
4. Ejecute window.print() automáticamente al montar el componente
5. Proporcione estilos diferentes para térmicas (58mm/80mm) y A4 usando media queries

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/dashboard/pedidos/[id]/imprimir/page.tsx` | Modified | Reemplazar placeholder con vista de impresión real |
| `app/dashboard/pedidos/[id]/imprimir/style.css` or CSS-in-TS | New | Agregar estilos de impresión para térmicas y A4 |
| `components/pedidos/PedidoDetail.tsx` | Unchanged | Ya tiene el enlace de impresión funcionando |
| `openspec/specs/pedidos/spec.md` | Modified | Agregar nueva sección para capacidad de factura-impresion |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Problemas de compatibilidad con diferentes impresoras térmicas | Medio | Probar con las especificaciones comunes de térmicas 58mm/80mm y usar unidades absolutas (mm) en CSS de impresión |
| Conflictos con estilos existentes que afecten la impresión | Bajo | Usar !important cuidadosamente en reglas de @media print y aislar estilos de impresión |
| El auto-trigger de window.print() podría ser bloqueado por pop-up blockers | Bajo | El print se dispara por acción de usuario (navegación a la ruta), lo que generalmente evita bloqueadores |

## Rollback Plan

Dado que este cambio es aditivo y reemplaza solo un placeholder:
1. Revertir los cambios en `app/dashboard/pedidos/[id]/imprimir/page.tsx` al contenido del placeholder original
2. Eliminar cualquier archivo de estilos de impresión creado
3. Si se modificó openspec/specs/pedidos/spec.md, revertir a la versión anterior
4. No hay cambios en la base de datos ni en la lógica de negocio que requieran revertir

## Dependencies

- Ninguna dependencia externa nueva. Se aprovechan los datos y acciones existentes del módulo de pedidos.

## Success Criteria

- [ ] Al navegar a `/dashboard/pedidos/[id]/imprimir`, se muestra una vista de factura lista para imprimir
- [ ] La factura incluye: encabezado de marca Envichips, número de pedido, fecha, información de cliente y domiciliario, tabla de ítems con descripción, cantidad y subtotal, sección de totales (subtotal, descuento, total), método de pago y observaciones
- [ ] Al cargar la página, se dispara automáticamente el cuadro de diálogo de impresión del navegador
- [ ] El CSS de impresión adapta correctamente el layout para impresoras térmicas de 58mm y 80mm (ancho limitado) y para formato A4
- [ ] Los márgenes, tamaños de fuente y espaciado son apropiados para cada tipo de impresión
- [ ] La factura se ve correctamente en vista previa de impresión del navegador