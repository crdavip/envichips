# Delta for Articulos

## ADDED Requirements

### Page gate por rol

El servidor componente de `/articulos` MUST verificar `roleGte(user, "ADMIN")` antes de renderizar. DOMICILIARIO MUST ser redirigido a `/no-autorizado`.

#### Scenario: Admin accede a artículos

- GIVEN usuario con rol ADMIN autenticado
- WHEN navega a `/articulos`
- THEN ve el listado completo de artículos

#### Scenario: Domiciliario redirigido

- GIVEN usuario con rol DOMICILIARIO autenticado
- WHEN navega a `/articulos`
- THEN es redirigido a `/no-autorizado`

### Server action guards

TODOS los server actions del módulo (`createArticulo`, `updateArticulo`, `deleteArticulo`, `registerPurchase`) MUST llamar `requireRole("ADMIN", user)` antes de ejecutar la mutación.

#### Scenario: Admin crea artículo

- GIVEN usuario ADMIN autenticado
- WHEN llama `createArticulo` con datos válidos
- THEN el artículo se crea correctamente

#### Scenario: Domiciliario no puede crear

- GIVEN usuario DOMICILIARIO autenticado
- WHEN llama `createArticulo`
- THEN retorna error "Acción no permitida para el rol actual"
- AND NO se crea el artículo

### Botones condicionales en cliente

Los componentes `ArticleList`, `ArticleCard` y `PurchaseModal` MUST ocultar botones de crear, editar y eliminar si `session.user.rol` es DOMICILIARIO.

#### Scenario: Admin ve acciones

- GIVEN usuario ADMIN en listado de artículos
- THEN ve botones de editar y toggle activo en cada tarjeta
- AND ve botón "Nuevo artículo" y "Registrar compra"

#### Scenario: Domiciliario sin acciones

- GIVEN usuario DOMICILIARIO en listado de artículos (no debería llegar, pero por seguridad)
- THEN NO ve ningún botón de acción
