# Delta for Movimientos de Caja

## ADDED Requirements

### Guard de rol en createMovimientoAction

`createMovimientoAction` MUST verificar `roleGte(user, "ADMIN")` antes de crear el movimiento. DOMICILIARIO NO MUST poder registrar movimientos.

#### Scenario: Admin crea movimiento

- GIVEN usuario ADMIN autenticado
- WHEN llama `createMovimientoAction` con datos válidos
- THEN el movimiento se crea correctamente

#### Scenario: Domiciliario rechazado

- GIVEN usuario DOMICILIARIO autenticado
- WHEN llama `createMovimientoAction`
- THEN retorna error "Acción no permitida para el rol actual"
- AND NO se crea el movimiento
