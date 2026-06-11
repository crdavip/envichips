# Delta for Informes

## MODIFIED Requirements

### Requirement: Dashboard DOMICILIARIO en página principal

DOMICILIARIO MUST ver un dashboard limitado en `app/(dashboard)/page.tsx` con estadísticas de su flujo de trabajo.
(Previously: DOMICILIARIO veía página de estadísticas vacía sin datos)

#### Scenario: DOMICILIARIO ve dashboard

- GIVEN DOMICILIARIO autenticado en el dashboard principal
- THEN MUST ver cards con: pedidos PENDIENTE disponibles (sin domiciliario), pedidos EN_CAMINO activos (propios), pedidos ENTREGADO hoy
- AND cada card MUST mostrar valor numérico

#### Scenario: Sin datos disponibles

- GIVEN DOMICILIARIO sin pedidos activos y sin PENDIENTE disponibles
- THEN dashboard MUST mostrar "0" en cards sin datos
- AND no MUST mostrar error o pantalla vacía

### Requirement: getPedidosAction para DOMICILIARIO

`getPedidosAction` MUST retornar para DOMICILIARIO: (a) pedidos PENDIENTE sin domiciliario, (b) pedidos propios sin filtro "solo hoy".
(Previously: solo retornaba pedidos propios del día actual)

#### Scenario: DOMICILIARIO consulta listado

- GIVEN DOMICILIARIO autenticado
- WHEN ejecuta `getPedidosAction`
- THEN retorna unión de: PENDIENTE sin domiciliario (disponibles) + pedidos donde domiciliarioId = user.id (activos)
- AND NO MUST filtrar solo hoy para pedidos activos

### Requirement: Control de Acceso — DOMICILIARIO dashboard

DOMICILIARIO MUST poder acceder a su dashboard en la página principal. La ruta `/informes` y sub-rutas MUST permanecer restringidas a roleGte(ADMIN).
(Previously: DOMICILIARIO no tenía dashboard, era redirigido de informes)

#### Scenario: DOMICILIARIO ve dashboard pero no informes

- GIVEN DOMICILIARIO autenticado
- THEN ve dashboard principal con sus estadísticas
- WHEN navega a `/informes`
- THEN es redirigido a `/no-autorizado` (comportamiento existente)

## ADDED Requirements

### Requirement: Servicio de estadísticas DOMICILIARIO

`lib/services/informes.ts` MUST exponer `getDashboardDomiciliario(userId)` retornando: disponibles (count), activos (count), entregadosHoy (count).

#### Scenario: Servicio retorna métricas correctas

- GIVEN domiciliario con 3 pedidos PENDIENTE disponibles, 2 EN_CAMINO activos, 1 ENTREGADO hoy
- WHEN se llama `getDashboardDomiciliario(userId)`
- THEN retorna `{ disponibles: 3, activos: 2, entregadosHoy: 1 }`
