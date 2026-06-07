# Spec: Mejora Gestión de Pedidos — Delta Spec

> Cambios sobre especificaciones existentes en `openspec/specs/pedidos/spec.md` y `openspec/specs/factura-impresion/spec.md`

---

## 1. Responsive — PedidoDetail (modifica spec `pedidos` sección 3)

### Acceptance Criteria (adicionales)
- [ ] En viewports < 640px, la tabla de items MUST reemplazarse por una lista vertical sin columnas
- [ ] En viewports < 640px, NO MUST haber scroll horizontal en ningún elemento
- [ ] El contenedor principal (`max-w-2xl`) MUST respetar el ancho del viewport
- [ ] En desktop (640px+), MUST mantener la tabla de items actual con `<Table>` de shadcn

### Technical Notes
- Usar `overflow-x-auto` en la tabla para desktop como fallback
- En mobile: iterar items con `flex flex-col gap-3` mostrando nombre, presentación, cantidad, precio unitario y subtotal en fila separada
- Aplicar `min-w-0` y `break-words` donde sea necesario

---

## 2. Asignación de Domiciliario (capability nueva + modifica spec `pedidos` sección 3)

### Acceptance Criteria (nuevos para sección 3 y generales)
- [ ] Admin/SuperAdmin MUST poder asignar un domiciliario a un pedido que no tenga uno
- [ ] Admin/SuperAdmin MUST poder cambiar el domiciliario de un pedido existente
- [ ] NO MUST permitir cambiar domiciliario si el pedido está `ENTREGADO` o `CANCELADO`
- [ ] Al cambiar domiciliario, MUST crear un registro en `HistorialEstado` con `estadoAntes = estadoDespues = estado actual` y motivo "Domiciliario asignado: [nombre]" o "Domiciliario cambiado: [anterior] → [nuevo]"
- [ ] La UI MUST mostrar un modal con selector de domiciliarios disponibles
- [ ] El modal MUST mostrar el domiciliario actual (si existe) como preseleccionado
- [ ] La UI MUST estar visible SOLO para Admin/SuperAdmin
- [ ] Al confirmar, MUST actualizar la UI sin recargar la página

### Technical Notes
- Nueva función en `lib/services/pedidos.ts`: `asignarDomiciliario(id, domiciliarioId, cambiadoPorId)`
- Nuevo schema en `lib/validations/pedidos.ts`: `asignarDomiciliarioSchema`
- Nueva server action: `asignarDomiciliarioAction(id, domiciliarioId)` en actions.ts
- Actualizar `updateEstadoSchema` NO es necesario — es una operación separada
- Reutilizar `getDomiciliariosAction()` que ya existe

---

## 3. Factura con Logo (modifica spec `factura-impresion`)

### Acceptance Criteria (adicionales sobre spec existente)
- [ ] La factura MUST incluir el logotipo completo de Envichips (`LogoType` SVG) en el encabezado
- [ ] En formato térmica 58mm: el logo MUST mostrarse con ancho máximo de 40mm, centrado
- [ ] En formato térmica 80mm: el logo MUST mostrarse con ancho máximo de 60mm, centrado
- [ ] En formato A4: el logo MUST mostrarse con ancho máximo de 120mm, centrado
- [ ] El logo MUST respetar la altura proporcional (relación de aspecto del SVG original: ~2.78:1)
- [ ] MUST usar `print-color-adjust: exact` y `-webkit-print-color-adjust: exact` para preservar colores
- [ ] El logo NO MUST mostrarse en pantalla (solo en impresión), la vista previa en navegador puede mostrar versión simplificada o a color

### Technical Notes
- Importar `LogoType` de `@/components/logo/logotype` en la page de impresión
- Renderizar el SVG dentro del `print-header` con clases Tailwind que se activen solo en `@media print`
- En pantalla: mostrar un placeholder o el logo pero con opacidad reducida (para vista previa)
- En print: mostrar el logo con `display: block !important`
