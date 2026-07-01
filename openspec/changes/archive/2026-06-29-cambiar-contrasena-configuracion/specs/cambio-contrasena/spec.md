# Cambio de Contraseña — SDD Spec

> Cambio de contraseña del propio usuario desde la página de configuración.
> Accesible para cualquier rol autenticado (SUPERADMIN, ADMIN, DOMICILIARIO).

## Requisitos Funcionales

### RF-05: Formulario de Cambio de Contraseña

Todo usuario autenticado DEBE poder cambiar su propia contraseña desde `/configuracion`.

**Campos del formulario:**
- `currentPassword` — requerido, contraseña actual
- `newPassword` — requerido, mínimo 6 caracteres
- `confirmNewPassword` — requerido, DEBE coincidir con `newPassword`

**Validaciones:**
- Errores de validación DEBEN mostrarse inline en el formulario
- El botón de envío DEBE estar deshabilitado si hay errores de validación

### RF-06: Seguridad del Cambio

- La contraseña actual DEBE verificarse con `bcrypt.compare` antes de actualizar
- Si la contraseña actual es incorrecta, DEBE devolver un error genérico "Contraseña actual incorrecta" — sin revelar si el usuario existe
- La nueva contraseña DEBE hashearse con bcryptjs (salt rounds 10) antes de persistir
- En caso de éxito, DEBE forzar cierre de sesión mediante `next-auth/react signOut()` y redirigir a `/login`
- La sesión NO DEBE permanecer válida después del cambio de contraseña

### RF-07: Propiedad del Cambio

- Un usuario SOLO PUEDE cambiar su PROPIA contraseña, verificado mediante `session.user.id === targetUserId`
- NO DEBE ser posible escalar privilegios mediante el cambio de contraseña

## Escenarios de Aceptación

### Escenario 1: Usuario cambia su contraseña exitosamente

- GIVEN Usuario autenticado con contraseña "oldPass123"
- WHEN Completa current: "oldPass123", new: "newPass456", confirm: "newPass456"
- THEN La contraseña se actualiza con hash bcrypt (salt rounds 10)
- AND Se cierra la sesión y redirige a `/login`

### Escenario 2: Contraseña actual incorrecta

- GIVEN Usuario autenticado con contraseña "correctPass"
- WHEN Completa current: "wrongPass", new: "newPass", confirm: "newPass"
- THEN Muestra error "Contraseña actual incorrecta"
- AND La contraseña NO se modifica

### Escenario 3: Nueva contraseña muy corta

- GIVEN Usuario autenticado
- WHEN Completa newPassword con valor "abc" (3 caracteres)
- THEN Muestra error de validación "mínimo 6 caracteres"
- AND El formulario NO se envía

### Escenario 4: Confirmación no coincide

- GIVEN Usuario autenticado
- WHEN Completa newPassword: "newPass123", confirmNewPassword: "different"
- THEN Muestra error de validación "Las contraseñas no coinciden"
- AND El formulario NO se envía

### Escenario 5: Admin/Domiciliario cambia contraseña

- GIVEN Usuario autenticado con rol ADMIN o DOMICILIARIO
- WHEN Está en `/configuracion`
- THEN Ve solo el formulario de cambio de contraseña
- AND NO ve el formulario de configuración del negocio

### Escenario 6: SuperAdmin cambia contraseña

- GIVEN Usuario autenticado con rol SUPERADMIN
- WHEN Está en `/configuracion`
- THEN Ve el formulario de configuración del negocio
- AND Ve el formulario de cambio de contraseña
