# Delta for configuracion-global

## MODIFIED Requirements

### Requirement: RF-04 — Seguridad

- SUPERADMIN DEBE poder ver y editar la configuración del negocio Y cambiar su propia contraseña desde `/configuracion`
- ADMIN y DOMICILIARIO DEBEN poder cambiar su propia contraseña pero NO DEBEN ver ni editar la configuración del negocio
- `/configuracion` NO DEBE denegar acceso a ningún rol autenticado
- La visibilidad de formularios se determina por rol: ConfigForm solo para SUPERADMIN, ChangePasswordForm para todos los roles
(Previously: Solo SUPERADMIN podía acceder a /configuracion; ADMIN y DOMICILIARIO recibían "No autorizado")

#### Scenario: Admin ve formulario de cambio de contraseña

- GIVEN Usuario autenticado con rol ADMIN
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de cambio de contraseña
- AND NO ve el formulario de configuración del negocio
- AND Puede cambiar su contraseña exitosamente

#### Scenario: Domiciliario ve formulario de cambio de contraseña

- GIVEN Usuario autenticado con rol DOMICILIARIO
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de cambio de contraseña
- AND NO ve el formulario de configuración del negocio
- AND Puede cambiar su contraseña exitosamente

#### Scenario: SuperAdmin ve ambos formularios

- GIVEN Usuario autenticado con rol SUPERADMIN
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de configuración del negocio
- AND Ve el formulario de cambio de contraseña
- AND Puede cambiar su contraseña exitosamente
