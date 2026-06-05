# Proposal: Fase 6 — Usuarios, Ganancias Netas, Configuración Global

## Intent

Completar la Fase 6 del PRD: gestión de usuarios del sistema (solo SuperAdmin), reporte detallado de ganancias netas con filtros históricos, y configuración global del negocio (nombre, teléfono para factura).

## Scope

### In Scope
- CRUD completo de usuarios (listar, crear, editar, activar/desactivar) — solo SuperAdmin
- Hash de password con bcryptjs al crear/editar usuarios
- Mejora del reporte de ganancias con selector de rango de fechas (hoy/semana/mes/personalizado)
- Modelo BusinessConfig con nombre del negocio y teléfono para factura
- UI de administración para editar la configuración del negocio
- Enlaces en el sidebar/nav para Usuarios y Configuración

### Out of Scope
- Roles y permisos dinámicos (Admin/Domiciliario no gestionan usuarios)
- Múltiples sucursales o sedes
- Logo del negocio (se puede agregar después en BusinessConfig)
- Reporte de ganancias con gráficos o exportación PDF

## Capabilities

### New Capabilities
- `usuarios`: CRUD de usuarios del sistema con roles, activación/desactivación, solo SuperAdmin
- `ganancias-netas`: Reporte de ganancias netas con filtro por rango de fechas
- `configuracion-global`: Configuración del negocio (nombre, teléfono)

### Modified Capabilities
- Ninguna. Los specs existentes no cambian a nivel de requerimientos.

## Approach

1. **Usuarios**: Servicio CRUD (`lib/services/usuarios.ts`) con bcrypt para password → validaciones Zod → server actions → páginas (list + create + edit). Soft-delete via `activo = false`.
2. **Ganancias netas**: Extender `getGanancias()` con parámetro dateRange → agregar selector de rango a la página existente → componente de filtro.
3. **Configuración**: Modelo Prisma `BusinessConfig` con singleton row → servicio `getUpsertConfig()` → validación Zod → página de administración.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `prisma/schema.prisma` | Modificado | + modelo BusinessConfig |
| `lib/services/usuarios.ts` | Nuevo | CRUD usuarios |
| `lib/services/configuracion.ts` | Nuevo | Get/upsert config negocio |
| `lib/services/informes.ts` | Modificado | getGanancias() con date range |
| `lib/validations/usuarios.ts` | Nuevo | Schemas Zod |
| `lib/validations/configuracion.ts` | Nuevo | Schema Zod |
| `app/(dashboard)/usuarios/` | Nuevo | Páginas list + create + edit |
| `app/(dashboard)/configuracion/` | Nuevo | Página de edición |
| `app/(dashboard)/informes/ganancias/page.tsx` | Modificado | + date range filter |
| `components/layout/nav-links.tsx` | Modificado | + links a Usuarios y Config |
| `components/ganancias/` | Nuevo | Filtro fechas |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Password en texto plano al crear usuario | Baja | bcrypt.hash() en el servicio, nunca almacenar raw |
| Que un SuperAdmin se desactive a sí mismo | Baja | Validar en server action que no sea self-target |
| Migración BusinessConfig con datos existentes | Baja | Agregar campo con default, seed opcional |
| Reporte de ganancias con fechas incorrectas | Baja | date-fns para manejo consistente de timezone COT |

## Rollback Plan

- **CRUD usuarios**: solo agrega archivos nuevos. Rollback → eliminar archivos y rama. Sin cambios al schema existente.
- **Ganancias**: función existente modificada con parámetro opcional (backward compatible). Rollback → restaurar versión anterior.
- **BusinessConfig**: nueva tabla. Rollback → revertir migración Prisma + eliminar archivos.

## Success Criteria

- [ ] SuperAdmin puede listar, crear, editar y desactivar usuarios
- [ ] Las contraseñas se guardan hasheadas con bcrypt
- [ ] Un usuario desactivado no puede iniciar sesión
- [ ] El reporte de ganancias netas permite filtrar por hoy/semana/mes/rango personalizado
- [ ] La configuración del negocio se guarda y se muestra en la UI
- [ ] Build sin errores (`npm run build`)
