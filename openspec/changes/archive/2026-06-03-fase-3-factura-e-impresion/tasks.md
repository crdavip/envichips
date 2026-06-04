# Tasks: Fase 3 — Factura e Impresión

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

Estimated changed lines: ~200–260. Low risk, but `force-chained` strategy splits into 2 stacked PRs to main for clean review.

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Print CSS + spec update | PR 1 → main | `print.css` + `spec.md` section 8 — independent foundation |
| 2 | Invoice page + verification | PR 2 → main | Replace `page.tsx` with functional client component; auto-print; lint+build |

## Phase 1: Foundation (PR 1 → main)

- [x] F3.1 Crear `app/dashboard/pedidos/[id]/imprimir/print.css` con `@media print` para tres formatos:
      - 58mm térmica (max-width 56mm): reducir espaciados, ocultar nav, fuente monospace 7pt
      - 80mm térmica (max-width 76mm): espaciado medio, misma fuente monospace
      - A4 (min-width 77mm): márgenes estándar, layout completo con fuente serif
- [x] F3.2 Verificar sección 8 en `openspec/specs/pedidos/spec.md` — ya existe (líneas 234-267), sin cambios necesarios

## Phase 2: Core Implementation (PR 2 → main)

- [ ] F3.3 Reemplazar `app/dashboard/pedidos/[id]/imprimir/page.tsx`: convertir a `"use client"`,
      importar `getPedidoByIdAction` y `formatCOP`, hacer fetch con `useEffect` + `useState`
- [ ] F3.4 Renderizar invoice layout: brand header "ENVICHIPS / Distribución de Snacks",
      pedido info (número, fecha, cliente, domiciliario), tabla items (cant, producto, subtotal),
      totales (subtotal, descuento, total), método de pago, observaciones, footer
- [ ] F3.5 Agregar `useEffect` con `window.print()` en mount + botón manual "Imprimir" como fallback
      si auto-print no se dispara
- [ ] F3.6 Importar `print.css` en la página y aplicar clases Tailwind + CSS module según diseño

## Phase 3: Verification

- [ ] F3.7 Ejecutar `npm run lint` y `npm run build`; corregir tipos/warnings
- [ ] F3.8 Probar manual: navegar a `/dashboard/pedidos/[id]/imprimir` → ver factura con datos →
      auto-print se dispara → verificar vista previa en 58mm/80mm/A4
- [ ] F3.9 Probar botón "Volver al detalle" funciona en screen; se oculta en @media print
