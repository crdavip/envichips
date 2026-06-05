# SDD Tasks: Fase 6 — Usuarios, Ganancias Netas, Configuración Global

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| PRs planificados | 3 (stacked-to-main) |
| PR 1 — Usuarios estimado | ~380 líneas |
| PR 2 — Ganancias Netas estimado | ~120 líneas |
| PR 3 — Config Global estimado | ~180 líneas |
| **Chained PRs recommended** | **Yes** (C3 configurado por usuario) |
| **Decision needed before apply** | **No** (C3 ya decidió chained PRs) |
| **400-line budget risk** | **Low** (cada PR bajo 400) |

## PR 1: CRUD Usuarios

### F6.1: Servicio de usuarios
- [x] Crear `lib/services/usuarios.ts`
  - `getUsuarios()`: listar todos incluyendo creador
  - `getUsuario(id)`: obtener por ID (sin password)
  - `createUsuario(data, creadoPorId)`: crear con bcrypt.hash
  - `updateUsuario(id, data)`: editar (password opcional)
  - `toggleUsuarioActivo(id, usuarioLogueadoId)`: activar/desactivar con validación self-target
  - `getUsuarioByEmail(email)`: para validar unicidad

### F6.2: Validaciones Zod
- [x] Crear `lib/validations/usuarios.ts`
  - Schema crear: nombre, email, password min 6, rol enum, telefono opcional
  - Schema editar: mismo que crear pero password opcional
  - Tipos inferidos con `z.output`

### F6.3: Server actions
- [x] Crear server actions (`"use server"`)
  - `createUsuarioAction(data)`: valida rol SUPERADMIN, llama servicio, revalidatePath
  - `updateUsuarioAction(id, data)`: valida rol, llama servicio, revalidatePath
  - `toggleUsuarioAction(id)`: valida rol + self-target check, revalidatePath

### F6.4: Página lista de usuarios
- [x] Crear `app/(dashboard)/usuarios/page.tsx`
  - Tabla con columnas: Nombre, Email, Rol, Estado, Teléfono, Último acceso, Creado
  - Indicador visual activo/inactivo
  - Botón "Nuevo usuario" → /usuarios/new
  - Cada fila: link a editar + botón toggle activo
  - Role check SUPERADMIN (redirect o "No autorizado")

### F6.5: Página crear usuario
- [x] Crear `app/(dashboard)/usuarios/new/page.tsx`
  - Formulario: nombre, email, password, rol (select), teléfono
  - Submit → server action → redirect a /usuarios
  - Loading skeleton con Suspense

### F6.6: Página editar usuario
- [x] Crear `app/(dashboard)/usuarios/[id]/page.tsx`
  - Formulario precargado con datos del usuario
  - Password opcional (placeholder "••••••••" si no se cambia)
  - Botón "Desactivar usuario" (si está activo) o "Activar usuario"
  - Confirmación antes de desactivar
  - Loading skeleton con Suspense

### F6.7: Nav / Sidebar
- [x] Agregar link "Usuarios" a `components/layout/nav-links.tsx`
  - Icono: `Shield` (lucide)
  - Ruta: `/usuarios`

## PR 2: Ganancias Netas con Date Range

### F6.8: Extender servicio de ganancias
- [ ] Modificar `getGanancias()` en `lib/services/informes.ts`
  - Agregar parámetros: `dateRange`, `customDesde`, `customHasta`
  - Reutilizar `getDateRange()` existente

### F6.9: Componente DateRangeFilter
- [ ] Crear `components/ganancias/DateRangeFilter.tsx`
  - Selector: Hoy | Esta semana | Este mes | Personalizado
  - Modo personalizado: inputs fecha Desde / Hasta
  - Navegar via search params (`?range=today&desde=&hasta=`)
  - Mantener consistencia visual con el resto del proyecto

### F6.10: Actualizar página de ganancias
- [ ] Modificar `app/(dashboard)/informes/ganancias/page.tsx`
  - Leer search params para rango actual
  - Pasar rango a `getGanancias()`
  - Mostrar `DateRangeFilter` arriba de las cards
  - Mostrar texto indicando el período (ej: "Hoy 4 de junio")

## PR 3: Configuración Global del Negocio

### F6.11: Migración Prisma — BusinessConfig
- [ ] Agregar modelo `BusinessConfig` a `prisma/schema.prisma` (ver design.md)
- [ ] Ejecutar `npx prisma migrate dev --name add_business_config`

### F6.12: Servicio de configuración
- [ ] Crear `lib/services/configuracion.ts`
  - `getConfig()`: findFirst, crear defaults si no existe
  - `upsertConfig(data, userId)`: crear o actualizar

### F6.13: Validaciones Zod
- [ ] Crear `lib/validations/configuracion.ts`
  - Schema: nombreNegocio (requerido), telefonoFactura (opcional)
  - Tipo inferido

### F6.14: Página de configuración
- [ ] Crear `app/(dashboard)/configuracion/page.tsx`
  - Formulario con nombreNegocio y telefonoFactura
  - Precargado con datos existentes
  - Submit → server action → mostrar éxito
  - Role check SUPERADMIN
  - Loading skeleton con Suspense

### F6.15: Nav / Sidebar
- [ ] Agregar link "Configuración" a `components/layout/nav-links.tsx`
  - Icono: `Settings` (lucide)
  - Ruta: `/configuracion`
