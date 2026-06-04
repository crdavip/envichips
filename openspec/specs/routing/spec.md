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
