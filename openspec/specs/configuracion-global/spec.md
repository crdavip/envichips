# Configuración Global del Negocio — SDD Spec

> Configuración global del negocio (nombre, teléfono para factura). Accesible para SUPERADMIN con formulario de configuración; ADMIN y DOMICILIARIO acceden solo para cambio de contraseña.

## Modelo de Datos

### BusinessConfig

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| `id` | `String` (UUID) | Sí | auto | Identificador único |
| `nombreNegocio` | `String` | Sí | — | Nombre comercial del negocio |
| `telefonoFactura` | `String` | No | — | Teléfono que aparece en facturas/pedidos |
| `actualizadoEn` | `DateTime` | Sí | `now()` | Timestamp de última modificación |
| `actualizadoPorId` | `String` | Sí | — | ID del usuario que hizo el cambio |

**Regla de negocio:** Solo DEBE existir UNA fila en la tabla (singleton). La aplicación SIEMPRE consulta la primera/única fila. Si no existe, se crea con valores por defecto.

## Requisitos Funcionales

### RF-01: Ver Configuración

El SUPERADMIN DEBE poder ver la configuración actual del negocio.

**Datos visibles:**
- Nombre del negocio
- Teléfono para factura
- Última actualización (fecha y quién)

### RF-02: Editar Configuración

El SUPERADMIN DEBE poder modificar la configuración mediante un formulario.

**Campos editables:**
- `nombreNegocio` — String, requerido, mínimo 1 carácter
- `telefonoFactura` — String, opcional

**Reglas de negocio:**
- Al guardar, DEBE registrar `actualizadoPorId` con el ID del SUPERADMIN
- Al guardar, DEBE actualizar `actualizadoEn` con la fecha/hora actual
- Siempre es un UPSERT: si no existe fila, se crea; si existe, se actualiza

### RF-03: Acceso a Configuración desde Otras Partes del Sistema

Los datos de configuración DEBEN estar disponibles para:

- **Factura / impresión de pedido** — el nombre y teléfono aparecen en el encabezado
- **Cualquier parte del sistema** que necesite mostrar el nombre del negocio

### RF-04: Seguridad

- SUPERADMIN DEBE poder ver y editar la configuración del negocio Y cambiar su propia contraseña desde `/configuracion`
- ADMIN y DOMICILIARIO DEBEN poder cambiar su propia contraseña pero NO DEBEN ver ni editar la configuración del negocio
- `/configuracion` NO DEBE denegar acceso a ningún rol autenticado
- La visibilidad de formularios se determina por rol: ConfigForm solo para SUPERADMIN, ChangePasswordForm para todos los roles
(Previously: Solo SUPERADMIN podía acceder a /configuracion; ADMIN y DOMICILIARIO recibían "No autorizado")

## Escenarios de Aceptación

### Escenario 1: SuperAdmin configura el negocio
```
Given: No existe configuración previa
When: El SUPERADMIN navega a /configuracion
  AND Completa nombreNegocio: "Envichips" y telefonoFactura: "3001234567"
  AND Guarda
Then: Se crea la configuración
  AND Muestra mensaje "Configuración guardada"
  AND Los datos persisten al recargar
```

### Escenario 2: SuperAdmin actualiza la configuración
```
Given: Existe configuración con nombreNegocio = "Envichips"
When: El SUPERADMIN cambia nombreNegocio a "Envichips SAS"
  AND Guarda
Then: Se actualiza el nombre
  AND actualizadoEn se actualiza
  AND actualizadoPorId contiene el ID del SUPERADMIN
```

### Escenario 3: Admin ve formulario de cambio de contraseña

- GIVEN Usuario autenticado con rol ADMIN
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de cambio de contraseña
- AND NO ve el formulario de configuración del negocio
- AND Puede cambiar su contraseña exitosamente

### Escenario 4: Domiciliario ve formulario de cambio de contraseña

- GIVEN Usuario autenticado con rol DOMICILIARIO
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de cambio de contraseña
- AND NO ve el formulario de configuración del negocio
- AND Puede cambiar su contraseña exitosamente

### Escenario 5: SuperAdmin ve ambos formularios

- GIVEN Usuario autenticado con rol SUPERADMIN
- WHEN Navega a `/configuracion`
- THEN Ve el formulario de configuración del negocio
- AND Ve el formulario de cambio de contraseña
- AND Puede cambiar su contraseña exitosamente

## Technical Notes

- Modelo Prisma: `BusinessConfig` con los campos definidos arriba
- Servicio: `lib/services/configuracion.ts` con función `getConfig()` y `upsertConfig()`
- `getConfig()` DEBE siempre devolver un objeto, incluso si la tabla está vacía (crear defaults automáticamente)
- La UI DEBE ser simple: un formulario en página única
- Usar el mismo patrón de server actions que el resto del proyecto
- Separar la validación Zod en `lib/validations/configuracion.ts`

## Migración de Datos

```prisma
model BusinessConfig {
  id               String   @id @default(uuid())
  nombreNegocio    String
  telefonoFactura  String?
  actualizadoEn    DateTime @default(now()) @updatedAt
  actualizadoPor   User     @relation(fields: [actualizadoPorId], references: [id])
  actualizadoPorId String
}
```
