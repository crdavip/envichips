# Usuarios — SDD Spec

> Módulo de gestión de usuarios del sistema. Solo accesible para rol SUPERADMIN.

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `SUPERADMIN` | Acceso total al sistema. Gestiona usuarios, configuración, informes financieros. |
| `ADMIN` | Gestiona pedidos, artículos, clientes, informes operativos. Sin acceso a usuarios ni configuración. |
| `DOMICIALIARIO` | Solo ve pedidos asignados y puede cambiar estado a ENTREGADO. |

## Requisitos Funcionales

### RF-01: Listar Usuarios

El SUPERADMIN DEBE poder ver una tabla con todos los usuarios del sistema.

**Datos visibles por fila:**
- Nombre
- Email
- Rol (SUPERADMIN / ADMIN / DOMICILIARIO)
- Estado (Activo / Inactivo)
- Teléfono
- Último acceso
- Fecha de creación

**Funcionalidades:**
- Paginación (opcional en MVP, puede ser scroll infinito)
- La tabla DEBE ordenarse por fecha de creación descendente
- DEBE mostrar indicador visual de estado (activo = verde, inactivo = rojo/gris)

### RF-02: Crear Usuario

El SUPERADMIN DEBE poder crear un nuevo usuario mediante un formulario.

**Campos del formulario:**
- `nombre` — String, requerido
- `email` — String, email válido, único en el sistema
- `password` — String, mínimo 6 caracteres
- `rol` — Enum: SUPERADMIN, ADMIN, DOMICILIARIO
- `telefono` — String, opcional

**Reglas de negocio:**
- La contraseña DEBE hashearse con bcryptjs antes de guardar
- El usuario se crea con `activo: true` por defecto
- `creadoPorId` DEBE registrar el ID del SUPERADMIN que lo creó
- Si el email ya existe, DEBE rechazar con error "Email ya registrado"

### RF-03: Editar Usuario

El SUPERADMIN DEBE poder editar un usuario existente.

**Campos editables:**
- `nombre`
- `email`
- `rol`
- `telefono`
- `password` — opcional; si se envía, se hashea; si está vacío, no se modifica

**Reglas de negocio:**
- NO se puede cambiar el propio rol de `SUPERADMIN` (prevenir auto-degradación)
- El email debe seguir siendo único (excluyendo el usuario actual)

### RF-04: Desactivar / Activar Usuario

El SUPERADMIN DEBE poder desactivar o activar un usuario.

**Reglas de negocio:**
- Un usuario desactivado (`activo: false`) NO PUEDE iniciar sesión (el authorize de NextAuth ya lo filtra)
- NO se puede desactivar el propio usuario logueado
- Los pedidos y datos creados por el usuario desactivado NO se eliminan (soft-delete)
- DEBE mostrarse confirmación antes de desactivar

### RF-05: Seguridad y Auditoría

- Solo usuarios con rol SUPERADMIN pueden acceder a `/usuarios` y sus acciones
- Cada creación/edición/desactivación DEBE quedar registrada (creadoPorId en User)
- Las contraseñas NUNCA se devuelven en respuestas de API o server actions
- El endpoint/server action DEBE rechazar si el usuario logueado no es SUPERADMIN

## Escenarios de Aceptación

### Escenario 1: SuperAdmin crea un Admin
```
Given: Usuario logueado con rol SUPERADMIN
When: Completa formulario con nombre "Carlos", email "carlos@test.com",
      password "123456", rol ADMIN
Then: Se crea el usuario con password hasheado
      AND Se redirige a la lista
      AND El nuevo usuario aparece en la tabla
```

### Escenario 2: Email duplicado
```
Given: Usuario logueado con rol SUPERADMIN
When: Intenta crear usuario con email ya existente
Then: Muestra error "Email ya registrado"
      AND No se crea el usuario
```

### Escenario 3: SuperAdmin se desactiva a sí mismo
```
Given: Usuario logueado con rol SUPERADMIN
When: Intenta desactivar su propio usuario
Then: Muestra error "No puedes desactivar tu propio usuario"
      AND El usuario sigue activo
```

### Escenario 4: Admin intenta acceder a /usuarios
```
Given: Usuario logueado con rol ADMIN
When: Navega a /usuarios o intenta ejecutar una action de usuarios
Then: Muestra "No autorizado"
      AND Ninguna acción se ejecuta
```

### Escenario 5: Editar contraseña opcional
```
Given: Usuario logueado con rol SUPERADMIN
When: Edita un usuario, deja password vacío
Then: La contraseña del usuario NO cambia
      AND Los demás campos se actualizan correctamente
```

## Technical Notes

- Usar `bcryptjs` (ya en el proyecto) con salt rounds = 10
- El hash DEBE hacerse en el servicio, no en el cliente ni en la validación
- El rol en session/jwt se lee de `(session.user as any).rol`
- Seguir el patrón de server actions de artículos/clientes
