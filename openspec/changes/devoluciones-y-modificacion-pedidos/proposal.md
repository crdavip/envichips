# Propuesta: Devoluciones y Modificación de Pedidos

**Módulo PRD**: Pedidos

## Intención

Permitir que Admin/SUPERADMIN modifique pedidos en PENDIENTE o EN_CAMINO — editar cantidades, agregar o eliminar items — con validación de inventario, recálculo de totales y auditoría en HistorialEstado con motivo descriptivo.

## Alcance

### Incluye
- Editar cantidades de items existentes en pedidos PENDIENTE/EN_CAMINO
- Agregar nuevos items a pedidos PENDIENTE/EN_CAMINO
- Eliminar items de pedidos PENDIENTE/EN_CAMINO
- Recálculo de subtotal y total tras modificaciones
- Validación de stock suficiente antes de guardar
- Re-validación del límite de deuda FIADO si aplica
- Registro en HistorialEstado con motivo descriptivo
- Solo Admin/SUPERADMIN (DOMICILIARIO no accede)

### Excluye
- Modificar pedidos ENTREGADO o CANCELADO
- Devoluciones/reembolsos completos (flujo separado)
- Re-stock de inventario (no necesario pre-ENTREGADO)
- Cambios de precio en items existentes (snapshots preservados)
- Deshacer/revertir modificaciones
- Dashboard de reportes de modificaciones

## Capacidades

### Nuevas
- `devoluciones-modificacion`: Modificación de pedidos con validación de inventario y auditoría en HistorialEstado

### Modificadas
- `pedidos`: Nueva sección de modificación en la especificación de gestión de pedidos (Sección 4 — Gestión de Estados)

## Enfoque Técnico

Actualización in-place de PedidoItem dentro de transacción Prisma. Eliminar items removidos, actualizar cantidades en items modificados, crear nuevos items con snapshots actuales. Recalcular subtotal y total desde cero. Crear HistorialEstado con `estadoAntes === estadoDespues` y motivo descriptivo. Validar stock de TODOS los items al modificar.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `lib/validations/pedidos.ts` | Nuevo | Schema `modificarPedidoSchema` |
| `lib/services/pedidos.ts` | Nuevo | Servicio `modificarPedido()` |
| `app/dashboard/pedidos/actions.ts` | Nuevo | Server Action `modificarPedidoAction()` |
| `components/pedidos/PedidoDetail.tsx` | Modificado | Botón + modal de modificación |
| `openspec/specs/pedidos/spec.md` | Modificado | Nueva sección §4 — Modificación |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Race condition en edición concurrente | Baja | Transacción con `findUniqueOrThrow` |
| Precios mezclados (snapshots viejos vs nuevos) | Media | UI explica que items nuevos usan precio actual |
| Stock insuficiente al modificar | Media | Re-validar stock de todos los items |
| Deuda FIADO desactualizada tras cambio total | Media | Re-validar límite si total cambia |
| Sin deshacer modificaciones | Baja | Advertir al usuario; cada cambio queda auditado |

## Plan de Rollback

- **Schema**: Sin cambios destructivos (no hay tablas nuevas ni columnas)
- **Código**: Revertir cambios en validaciones, servicio, action y componente
- **Datos**: Modificaciones auditables en HistorialEstado — sin migración de datos necesaria

## Dependencias

- Ninguna externa

## Criterios de Éxito

- [ ] Admin edita cantidades, agrega y elimina items en pedidos PENDIENTE/EN_CAMINO
- [ ] Stock validado antes de guardar; error si insuficiente
- [ ] HistorialEstado registra cada modificación con motivo y datos del usuario
- [ ] Totales recalculados correctamente (subtotal, descuento, total)
- [ ] Límite FIADO re-validado cuando el total cambia
- [ ] DOMICILIARIO no ve ni accede a opciones de modificación
