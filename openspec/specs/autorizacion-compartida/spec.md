# Autorización Compartida Specification

## Purpose

Helpers reutilizables que unifican la verificación de roles en toda la app. Soportan gates en server actions, páginas servidor y componentes cliente.

## Requirements

### requireRole(rol, user)

The function MUST comparar `session.user.rol === rol`. MUST lanzar error si no coincide. MUST aceptar string o array de roles.

#### Scenario: Rol coincide

- GIVEN usuario autenticado con rol ADMIN
- WHEN se llama `requireRole("ADMIN", user)`
- THEN no lanza error

#### Scenario: Rol no coincide

- GIVEN usuario autenticado con rol DOMICILIARIO
- WHEN se llama `requireRole("ADMIN", user)`
- THEN lanza `UnauthorizedError` con mensaje "Acción no permitida para el rol actual"

### requireAuth(user)

The function MUST lanzar error si `user` es null o undefined.

#### Scenario: Autenticado

- GIVEN usuario con sesión válida
- WHEN se llama `requireAuth(user)`
- THEN no lanza error

#### Scenario: No autenticado

- GIVEN usuario sin sesión (user = null)
- WHEN se llama `requireAuth(user)`
- THEN lanza error "Debe iniciar sesión"

### roleGte(user, minRol)

The function MUST verificar jerarquía: SUPERADMIN(3) > ADMIN(2) > DOMICILIARIO(1). Retorna boolean.

#### Scenario: Rol suficiente

- GIVEN usuario ADMIN
- WHEN se llama `roleGte(user, "DOMICILIARIO")`
- THEN retorna true

#### Scenario: Rol insuficiente

- GIVEN usuario DOMICILIARIO
- WHEN se llama `roleGte(user, "ADMIN")`
- THEN retorna false
