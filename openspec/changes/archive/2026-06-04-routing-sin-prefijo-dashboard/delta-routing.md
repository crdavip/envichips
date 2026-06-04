# Delta Spec: Routing — eliminar prefijo `/dashboard`

## Change Reference

- **Change**: `routing-sin-prefijo-dashboard`
- **Parent Capability**: `routing`

## Requirements

### R1: Las rutas de la aplicación no deben incluir `/dashboard`

- **Given** un usuario autenticado navega a `/`
- **Then** ve el dashboard (no redirige a `/dashboard`)

- **Given** un usuario autenticado navega a `/articulos`
- **Then** ve la lista de artículos

- **Given** un usuario autenticado navega a `/pedidos`
- **Then** ve la lista de pedidos

- **Given** un usuario autenticado navega a `/clientes`
- **Then** ve la lista de clientes

- **Given** un usuario autenticado navega a `/informes`
- **Then** ve el hub de informes

### R2: Las sub-rutas de cada sección deben funcionar sin `/dashboard`

- **Given** un usuario navega a `/articulos/{id}`
- **Then** ve el detalle del artículo

- **Given** un usuario navega a `/pedidos/create`
- **Then** ve el formulario de creación de pedido

- **Given** un usuario navega a `/pedidos/{id}`
- **Then** ve el detalle del pedido

- **Given** un usuario navega a `/informes/ventas`, `/informes/caja`, etc.
- **Then** ve el reporte correspondiente

### R3: Todos los enlaces internos deben usar las rutas nuevas

- Enlaces en sidebar, bottom nav, acciones rápidas, listas, detalles
- `revalidatePath` en server actions
- `router.push` en componentes client-side

### R4: El auth flow no debe cambiar

- Usuarios no autenticados son redirigidos a `/login`
- Usuarios autenticados ven el contenido protegido

## No-Cambio (Out of Scope)

- No cambia el layout, la UI, ni la lógica de negocio
- No cambia APIs internas ni server actions
- No migra datos ni cambia schemas
