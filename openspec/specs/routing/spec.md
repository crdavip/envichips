# Spec: Routing

## Requirements

### R1: Clean URLs sin prefijos redundantes

- **Given** un usuario autenticado navega a `/`
- **Then** ve el dashboard

- **Given** un usuario autenticado navega a `/articulos`
- **Then** ve la lista de artículos

- **Given** un usuario autenticado navega a `/pedidos`
- **Then** ve la lista de pedidos

- **Given** un usuario autenticado navega a `/clientes`
- **Then** ve la lista de clientes

- **Given** un usuario autenticado navega a `/informes`
- **Then** ve el hub de informes

### R2: Sub-rutas funcionales

- **Given** un usuario navega a `/articulos/{id}`
- **Then** ve el detalle del artículo

- **Given** un usuario navega a `/pedidos/create`
- **Then** ve el formulario de creación de pedido

- **Given** un usuario navega a `/pedidos/{id}`
- **Then** ve el detalle del pedido

- **Given** un usuario navega a `/informes/ventas`, `/informes/caja`, etc.
- **Then** ve el reporte correspondiente

### R3: Enlaces internos consistentes

- Todos los enlaces (sidebar, bottom nav, acciones rápidas, listas, detalles) usan las rutas canónicas
- `revalidatePath` en server actions usa las rutas canónicas
- `router.push` en componentes client-side usa las rutas canónicas

### R4: Auth flow protegido por layout

- Usuarios no autenticados son redirigidos a `/login`
- Usuarios autenticados ven el contenido protegido
- El layout de dashboard es el responsable del guard de auth

### R5: Navegación filtrada por rol en sidebar

La sidebar MUST filtrar los nav-links según `session.user.rol`. DOMICILIARIO ve solo Dashboard y Pedidos. ADMIN y SUPERADMIN ven todas las secciones.

- **Given** usuario ADMIN autenticado
- **When** se renderiza la sidebar
- **Then** ve links a: Dashboard, Pedidos, Artículos, Clientes, Informes

- **Given** usuario DOMICILIARIO autenticado
- **When** se renderiza la sidebar
- **Then** ve solo links a: Dashboard y Pedidos

### R6: Bottom-nav filtrada por rol

La bottom-nav (mobile) MUST aplicar las mismas reglas que la sidebar.

- **Given** usuario ADMIN autenticado en viewport mobile
- **When** se renderiza bottom-nav
- **Then** ve todos los iconos de navegación

- **Given** usuario DOMICILIARIO autenticado en viewport mobile
- **When** se renderiza bottom-nav
- **Then** ve solo Dashboard y Pedidos

### R7: User-menu "Configuración" para SUPERADMIN

El menú de usuario MUST mostrar "Configuración" SOLO si `session.user.rol === "SUPERADMIN"`.

- **Given** usuario SUPERADMIN autenticado
- **When** abre el menú de usuario
- **Then** ve la opción "Configuración"

- **Given** usuario ADMIN autenticado
- **When** abre el menú de usuario
- **Then** NO ve la opción "Configuración"
