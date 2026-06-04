# Specs: Factura e Impresión

> Envichips SaaS · Especificaciones detalladas
> Basado en PRD v1.1 — Módulo: Pedidos

---

## Purpose

Generar e imprimir facturas para pedidos, soportando impresoras térmicas (58mm y 80mm) y formato A4, con auto-trigger de impresión al cargar la página.

## Requirements

### Requirement: Generar Vista de Factura

El sistema MUST mostrar una vista lista para imprimir con el layout de factura al navegar a `/dashboard/pedidos/[id]/imprimir`.

#### Scenario: Vista de factura carga correctamente

- GIVEN Un pedido existente con ID válido
- WHEN Navego a `/dashboard/pedidos/[id]/imprimir`
- THEN Se muestra una vista lista para imprimir con el layout de factura
- AND Se dispara automáticamente `window.print()` para mostrar el cuadro de diálogo de impresión

#### Scenario: Factura incluye todos los datos requeridos

- GIVEN Un pedido con todos sus datos (numero, fecha, cliente, domiciliario, items, totales, método de pago, observaciones)
- WHEN Navego a `/dashboard/pedidos/[id]/imprimir`
- THEN La factura incluye: encabezado de marca Envichips, número de pedido, fecha, información de cliente y domiciliario, tabla de ítems con descripción, cantidad y subtotal, sección de totales (subtotal, descuento, total), método de pago y observaciones

### Requirement: Adaptar Layout para Impresoras Térmicas

El sistema MUST adaptar correctamente el layout para impresoras térmicas de 58mm y 80mm de ancho.

#### Scenario: Layout para impresora térmica 58mm

- GIVEN Una impresora térmica de 58mm de ancho
- WHEN Se envía la factura a imprimir
- THEN El CSS de impresión adapta el layout para un máximo de 56mm de contenido
- AND Se ocultan elementos no esenciales
- AND Se reduce el espaciado
- AND Se usa fuente sans-serif legible

#### Scenario: Layout para impresora térmica 80mm

- GIVEN Una impresora térmica de 80mm de ancho
- WHEN Se envía la factura a imprimir
- THEN El CSS de impresión adapta el layout para un máximo de 76mm de contenido
- AND Se mantiene buen espaciado entre elementos
- AND Se usa fuente sans-serif legible

### Requirement: Soportar Formato A4

El sistema MUST soportar formato A4 (210mm x 297mm) con márgenes apropiados.

#### Scenario: Layout para formato A4

- GIVEN Una impresora A4 estándar
- WHEN Se envía la factura a imprimir
- THEN El CSS de impresión mantiene el layout completo con márgenes estándar de impresión
- AND Se muestra la factura con presentación adecuada para documentos A4

### Requirement: Formato de Valores Monetarios

El sistema MUST mostrar todos los valores monetarios en formato COP sin decimales.

#### Scenario: Formato COP correcto

- GIVEN Un pedido con valores monetarios (subtotal: 171500, descuento: 0, total: 171500)
- WHEN Se genera la vista de factura
- THEN Todos los montos se muestran en formato COP sin decimales y con separador de miles (ej: `$171.500` no `$171500.00`)
- AND Se usa el formato `$1.500.000` para valores mayores

### Requirement: Tipografía Legible en Térmicas

El sistema MUST usar tipografía legible en impresoras térmicas.

#### Scenario: Tamaños de fuente apropiados

- GIVEN Una vista de factura para impresión térmica
- WHEN Se renderiza la factura
- THEN El tamaño mínimo de fuente es 8pt para contenido
- AND El tamaño mínimo de fuente es 10pt para encabezados
- AND Se evita el corte de texto en impresoras térmicas ajustando el ancho de columnas

### Requirement: Manejo de Bloqueo de Pop-up

El sistema MUST proporcionar instrucciones manuales si el navegador bloquea el pop-up de impresión.

#### Scenario: Instrucciones para impresión manual

- GIVEN El navegador bloquea el pop-up automático de impresión
- WHEN Se carga la página de factura
- THEN Se proporcionan instrucciones manuales para imprimir (Ctrl+P o Cmd+P)