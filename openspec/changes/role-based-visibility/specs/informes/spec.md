# Delta for Informes

## ADDED Requirements

### Page gate por rol

El servidor componente de `/informes` y todos sus sub-reportes (`/ventas`, `/inventario`, `/caja`, `/domiciliarios`) MUST verificar `roleGte(user, "ADMIN")`. DOMICILIARIO MUST ser redirigido a `/no-autorizado`.

#### Scenario: Admin accede a informes

- GIVEN usuario ADMIN autenticado
- WHEN navega a `/informes`
- THEN ve el resumen del día completo

#### Scenario: Domiciliario redirigido

- GIVEN usuario DOMICILIARIO autenticado
- WHEN navega a `/informes`
- THEN es redirigido a `/no-autorizado`

### Server action guards

TODOS los server actions de informes (`getResumenAction`, `getVentasAction`, `getInventarioAction`, `getDomiciliariosAction`) MUST verificar `roleGte(user, "ADMIN")`. `getGananciasAction` MUST mantener su verificación de SUPERADMIN.

#### Scenario: Admin consulta resumen

- GIVEN usuario ADMIN autenticado
- WHEN llama `getResumenAction`
- THEN retorna métricas del día

#### Scenario: Domiciliario no accede a datos

- GIVEN usuario DOMICILIARIO autenticado
- WHEN llama `getResumenAction`
- THEN retorna error de autorización

### Navegación oculta para DOMICILIARIO

Los links a Informes en sidebar y bottom-nav MUST ocultarse para rol DOMICILIARIO.

#### Scenario: Admin ve link a informes

- GIVEN usuario ADMIN en navegación
- THEN ve link a "Informes" en sidebar y bottom-nav

#### Scenario: Domiciliario no ve link

- GIVEN usuario DOMICILIARIO en navegación
- THEN NO ve link a "Informes"
