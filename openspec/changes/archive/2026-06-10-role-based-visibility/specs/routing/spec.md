# Delta for Routing

## ADDED Requirements

### Navegación filtrada por rol en sidebar

La sidebar MUST filtrar los nav-links según `session.user.rol`. DOMICILIARIO ve solo Dashboard y Pedidos. ADMIN y SUPERADMIN ven todas las secciones.

#### Scenario: Admin ve todas las secciones

- GIVEN usuario ADMIN autenticado
- WHEN se renderiza la sidebar
- THEN ve links a: Dashboard, Pedidos, Artículos, Clientes, Informes

#### Scenario: Domiciliario ve solo lo suyo

- GIVEN usuario DOMICILIARIO autenticado
- WHEN se renderiza la sidebar
- THEN ve solo links a: Dashboard y Pedidos

### Bottom-nav filtrada por rol

La bottom-nav (mobile) MUST aplicar las mismas reglas que la sidebar.

#### Scenario: Admin en mobile

- GIVEN usuario ADMIN autenticado en viewport mobile
- WHEN se renderiza bottom-nav
- THEN ve todos los iconos de navegación

#### Scenario: Domiciliario en mobile

- GIVEN usuario DOMICILIARIO autenticado en viewport mobile
- WHEN se renderiza bottom-nav
- THEN ve solo Dashboard y Pedidos

### User-menu "Configuración" para SUPERADMIN

El menú de usuario MUST mostrar "Configuración" SOLO si `session.user.rol === "SUPERADMIN"`.

#### Scenario: SuperAdmin ve Configuración

- GIVEN usuario SUPERADMIN autenticado
- WHEN abre el menú de usuario
- THEN ve la opción "Configuración"

#### Scenario: Admin no ve Configuración

- GIVEN usuario ADMIN autenticado
- WHEN abre el menú de usuario
- THEN NO ve la opción "Configuración"
