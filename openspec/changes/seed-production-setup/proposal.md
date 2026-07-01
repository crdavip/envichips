# Propuesta: Separación de seed — producción vs desarrollo

## Intención

El seed actual (`prisma/seed.ts`, 1025 líneas) mezcla datos reales de productos con datos demo falsos (48 clientes, 85 pedidos, etc.). No existe ningún guard entre el entorno de desarrollo y producción. Esto hace imposible inicializar una instancia limpia de producción sin arrastrar datos demo, y expone a insertar masivamente datos de prueba en un ambiente real.

## Alcance

### Incluye
- División del seed en 3 archivos (router, production, dev)
- `seed.production.ts`: BusinessConfig (Envichips), 1 Sequence, 1 SUPERADMIN, 54 artículos con stock 0
- `seed.dev.ts`: réplica exacta del seed actual con todos los datos demo
- `seed.ts`: router que envía a uno u otro según `SEED_MODE` / `NODE_ENV`
- Variables de entorno `SEED_MODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` en `.env.example`
- Soporte para `ADMIN_PASSWORD` desde variable de entorno en modo producción

### Excluye
- Cambios en esquema de Prisma (no se tocan modelos ni migraciones)
- Lógica de UI o endpoints
- Policies de seed en producción más allá del bootstrap mínimo

## Capacidades

### Nuevas Capacidades
None — cambio puramente de infraestructura, sin nuevas capacidades a nivel de especificación.

### Capacidades Modificadas
None — ningún spec existente cambia su comportamiento. El seed es un artifact de setup, no una capability del producto.

## Enfoque

Refactor del seed actual en tres archivos:
- `seed.production.ts` extrae BusinessConfig, Sequence, Artículos (stock 0) y SUPERADMIN del seed actual, eliminando clientes/pedidos/compras/movimientos.
- `seed.dev.ts` = copia idéntica del `seed.ts` actual (sin cambios).
- `seed.ts` evalúa `SEED_MODE=production` o `NODE_ENV=production` para delegar al archivo correspondiente.
- Si `ADMIN_PASSWORD` existe como env var en modo producción, reemplaza el hardcoded `admin123`.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `prisma/seed.ts` | Modificado | Router mínimo que delega según entorno |
| `prisma/seed.production.ts` | Nuevo | Bootstrap limpio de producción |
| `prisma/seed.dev.ts` | Nuevo | Seed demo completo (sin cambios) |
| `.env.example` | Modificado | Nuevas vars `SEED_MODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| `seed.dev.ts` difiere del seed actual por error humano | Baja | Migración controlada: copiar archivo, luego refactorizar |
| Contraseña hardcodeada en producción | Media | `ADMIN_PASSWORD` env var sobreescribe el default; documentar cambio obligatorio post-login |
| seed.production.ts se ejecuta accidentalmente en dev | Baja | El router requiere `SEED_MODE=production` explícito o `NODE_ENV=production` |

## Plan de Rollback

1. Revertir `prisma/seed.ts` a su versión original (single file, 1025 líneas).
2. Eliminar `prisma/seed.production.ts` y `prisma/seed.dev.ts`.
3. Restaurar `.env.example` a su estado anterior.
4. `git revert` del commit de seed, o `git checkout HEAD~1 -- prisma/`

## Dependencias

- `bcryptjs` (ya instalado)
- `dotenv` (ya instalado)

## Criterios de Éxito

- [ ] `npx tsx prisma/seed.ts` en entorno local ejecuta seed.dev y crea todos los datos demo
- [ ] `SEED_MODE=production npx tsx prisma/seed.ts` ejecuta seed.production sin datos demo
- [ ] seed.production crea exactamente: 1 BusinessConfig, 1 Sequence, 54 artículos (stock 0), 1 SUPERADMIN
- [ ] `ADMIN_PASSWORD` env var cambia la contraseña del SUPERADMIN en producción
- [ ] seed.dev produce exactamente los mismos datos que el seed original
