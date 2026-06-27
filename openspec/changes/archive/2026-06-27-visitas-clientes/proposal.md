# Propuesta: Visitas a Clientes

**Módulo PRD**: Clientes

## Intención

Domiciliarios y administradores no tienen visibilidad de la última vez que visitaron un cliente. La fecha del último pedido entregado es un proxy insuficiente: las visitas sin pedido no se registran, y no hay alertas que indiquen clientes con atención pendiente. Esto genera oportunidades perdidas de atención proactiva.

## Alcance

### Incluye
- Nuevo modelo `RegistroVisita` en Prisma (separado de Cliente)
- Creación automática de visita al marcar Pedido como `ENTREGADO`
- Botón "Registrar visita" manual en listado y detalle de cliente
- Columna "Última visita" en listado de clientes con badge de alerta si >7 días
- Alerta de 7+ días sin visita (solo clientes activos)
- Tarjeta resumen en dashboard con contador y enlace al listado filtrado

### Excluye
- Notificaciones push, WebSockets o emails
- Umbral configurable (7 días fijo)
- Historial de visitas en perfil de domiciliario

## Capacidades

### Nuevas Capacidades
- `visitas-clientes`: Registro de visitas (auto y manual), consulta de última visita, alerta de 7+ días

### Capacidades Modificadas
- `clientes`: Nuevos requisitos — indicador visual de días desde última visita, botón de registro manual
- `pedidos`: Nuevo requisito — al transicionar a `ENTREGADO`, crear `RegistroVisita` automático

## Enfoque Técnico

1. Modelo `RegistroVisita` (id, clienteId, userId, fecha, notas?, @@index([clienteId, fecha]))
2. En `actualizarEstado()` del servicio de pedidos: al pasar a `ENTREGADO`, insertar visita con `userId` del que ejecuta la transición
3. Servicio `getUltimaVisita(clienteId)` y `getClientesSinVisita(dias)` en `lib/services/clientes.ts`
4. Listado de clientes: columna con días desde última visita + badge rojo si >7
5. Dashboard: query agregada `COUNT` de clientes activos sin visita en últimos 7 días desde `creadoEn` o última visita

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `prisma/schema.prisma` | Nuevo | Modelo `RegistroVisita` |
| `lib/services/clientes.ts` | Modificado | Consultas de última visita |
| `lib/services/pedidos.ts` | Modificado | Auto-crear visita en ENTREGADO |
| `app/dashboard/clientes/actions.ts` | Modificado | Server action registrar visita |
| `app/dashboard/clientes/page.tsx` | Modificado | Columna visita + botón |
| `app/dashboard/clientes/[id]/page.tsx` | Modificado | Sección visitas + botón |
| `app/dashboard/page.tsx` | Modificado | Tarjeta resumen visitas |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Migración DB (tabla nueva + seed) | Baja | `prisma migrate dev`, rollback con migrate down |
| Performance en listado con join a visitas | Baja | Índice compuesto [clienteId, fecha] |

## Plan de Rollback

1. `git revert` del commit de schema + migración
2. `npx prisma migrate dev` para revertir la tabla
3. Revertir cambios en servicios, acciones y componentes

## Dependencias

- Migración Prisma para modelo `RegistroVisita`

## Criterios de Éxito

- [ ] Admin/domiciliario ve "Última visita" en listado de clientes con días transcurridos
- [ ] Al marcar pedido como ENTREGADO se crea `RegistroVisita` automático
- [ ] Botón "Registrar visita" permite registro manual sin pedido
- [ ] Dashboard muestra contador de clientes con >7 días sin visita
- [ ] Clientes inactivos NO aparecen en la alerta
