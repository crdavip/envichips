# Delta for Pedidos

## ADDED Requirements

### Requirement: Añadir Sección de Impresión de Factura

El sistema MUST añadir una nueva sección "8. Factura e Impresión" al espec de pedidos que documente la funcionalidad de impresión de facturas para pedidos, soportando impresoras térmicas (58mm y 80mm) y formato A4, con auto-trigger de impresión al cargar la página.

#### Scenario: Nueva sección de impresión agregada

- GIVEN El espec existente de pedidos con 7 sections
- WHEN Se implementa la funcionalidad de impresión de factura
- THEN Se añade una nueva sección "8. Factura e Impresión" al espec
- AND Esta sección describe la ruta `/dashboard/pedidos/[id]/imprimir`
- AND Esta sección incluye criterios de aceptación para la vista de impresión
- AND Esta sección incluye escenarios de prueba para impresión térmica y A4

#### Scenario: Documentar ruta de impresión

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que la ruta `/dashboard/pedidos/[id]/imprimir` muestra una vista lista para imprimir con el layout de factura
- AND Se documenta que al cargar la página se dispara automáticamente `window.print()`

#### Scenario: Documentar contenido de factura

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que la factura debe incluir: encabezado de marca Envichips, número de pedido, fecha, información de cliente y domiciliario, tabla de ítems con descripción, cantidad y subtotal, sección de totales (subtotal, descuento, total), método de pago y observaciones

#### Scenario: Documentar adaptabilidad para térmicas

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que el CSS de impresión debe adaptar correctamente el layout para impresoras térmicas de 58mm de ancho (máximo 56mm de contenido) y 80mm de ancho (máximo 76mm de contenido)

#### Scenario: Documentar soporte para A4

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que el CSS de impresión debe soportar formato A4 (210mm x 297mm) con márgenes apropiados

#### Scenario: Documentar formato COP

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que todos los valores monetarios deben mostrarse en formato COP sin decimales (ej: `$1.500.000`)

#### Scenario: Documentar tipografía legible

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que la tipografía debe ser legible en impresoras térmicas (tamaño mínimo 8pt para contenido, 10pt para encabezados)
- AND Se documenta que el ancho de columnas en la tabla de ítems debe ajustarse para evitar corte de texto en impresoras térmicas

#### Scenario: Documentar auto-trigger y manejo de pop-up

- GIVEN La nueva sección de impresión de factura
- WHEN Se revisa el espec
- THEN Se documenta que el auto-trigger de window.print() debe ejecutarse en `useEffect` con dependencia vacía para correr solo en mount
- AND Se documenta que si el navegador bloquea el pop-up, se deben proporcionar instrucciones manuales para imprimir (Ctrl+P o Cmd+P)