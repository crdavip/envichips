# Archive Report: Fase 6 — Usuarios, Ganancias Netas, Configuración Global

**Date**: 2026-06-04
**Mode**: openspec
**Verdict**: PASS

## Change Summary

Fase 6 del PRD de Envichips: gestión de usuarios del sistema (solo SuperAdmin), reporte detallado de ganancias netas con filtros históricos por rango de fechas, y configuración global del negocio (nombre, teléfono para factura).

## What Was Implemented

### PR 1: CRUD Usuarios (~380 líneas)
- Servicio CRUD completo con bcrypt hash para contraseñas
- Validaciones Zod para crear/editar
- Server actions con role check SUPERADMIN
- 3 páginas: listar, crear, editar
- Soft-delete con `activo = false`
- Validación de self-desactivación

### PR 2: Ganancias Netas con Date Range (~120 líneas)
- Extensión de `getGanancias()` con parámetros dateRange
- Componente `DateRangeFilter` (hoy/semana/mes/personalizado)
- Filtro vía search params (`?rango=today&desde=&hasta=`)
- Indicador de período visible

### PR 3: Configuración Global (~180 líneas)
- Modelo Prisma `BusinessConfig` (singleton)
- Servicio con `getConfig()` (auto-create defaults) y `upsertConfig()`
- Validación Zod
- Página de administración con formulario
- Migración Prisma ejecutada

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| usuarios | Created (pre-existing) | 5 requirements, 5 acceptance scenarios |
| ganancias-netas | Created (pre-existing) | 4 requirements, 4 acceptance scenarios |
| configuracion-global | Created (pre-existing) | 4 requirements, 3 acceptance scenarios |

> All 3 specs were created directly in `openspec/specs/` during implementation. No delta merge was required — specs are already at their final state.

## Archive Contents

- `proposal.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (15/15 tasks complete)
- `verify-report.md` ✅ (PASS)
- `exploration.md` ✅

## Task Completion

| PR | Tasks | Status |
|----|-------|--------|
| PR 1 — CRUD Usuarios | F6.1–F6.7 | ✅ 7/7 |
| PR 2 — Ganancias Netas | F6.8–F6.10 | ✅ 3/3 |
| PR 3 — Config Global | F6.11–F6.15 | ✅ 5/5 |
| **Total** | **15** | **✅ 15/15** |

## Verify Verdict

**PASS** — No CRITICAL issues. Build compiles cleanly. All acceptance scenarios covered. Minor suggestions noted (confirm dialog, default userId in getConfig).

## Source of Truth Updated

The following specs now reflect the new behavior:
- `openspec/specs/usuarios/spec.md`
- `openspec/specs/ganancias-netas/spec.md`
- `openspec/specs/configuracion-global/spec.md`

## Files Affected

| Path | Action |
|------|--------|
| `lib/services/usuarios.ts` | Created |
| `lib/services/configuracion.ts` | Created |
| `lib/services/informes.ts` | Modified (getGanancias with dateRange) |
| `lib/validations/usuarios.ts` | Created |
| `lib/validations/configuracion.ts` | Created |
| `app/(dashboard)/usuarios/page.tsx` | Created |
| `app/(dashboard)/usuarios/new/page.tsx` | Created |
| `app/(dashboard)/usuarios/[id]/page.tsx` | Created |
| `app/(dashboard)/configuracion/page.tsx` | Created |
| `app/(dashboard)/informes/ganancias/page.tsx` | Modified |
| `components/ganancias/DateRangeFilter.tsx` | Created |
| `components/layout/nav-links.tsx` | Modified (+Usuarios, +Configuración) |
| `prisma/schema.prisma` | Modified (+BusinessConfig) |

## SDD Cycle Complete

The change has been fully planned, designed, implemented, verified, and archived.

**Ready for the next change.**
