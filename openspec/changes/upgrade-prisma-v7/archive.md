# Archive: Upgrade Prisma ORM v6 → v7

**Change**: upgrade-prisma-v7
**Status**: ARCHIVED
**Date**: 2026-06-06

## Summary

Successfully upgraded Prisma ORM from v6.19.3 to v7.8.0 across the Envichips platform.

## Artifacts

| Artifact | Path |
|---|---|
| Proposal | openspec/changes/upgrade-prisma-v7/proposal.md |
| Spec | openspec/changes/upgrade-prisma-v7/spec.md |
| Design | openspec/changes/upgrade-prisma-v7/design.md |
| Tasks | openspec/changes/upgrade-prisma-v7/tasks.md |
| Apply Progress | Applied via sub-agent |
| Verify Report | openspec/changes/upgrade-prisma-v7/verify-report.md |

## Changes Delivered

1. **Dependencies**: prisma, @prisma/client, @prisma/adapter-pg → ^7.8.0
2. **Schema**: generator provider `prisma-client-js` → `prisma-client`
3. **Schema**: removed `url` from datasource block (now in prisma.config.ts)
4. **prisma.config.ts**: added `migrations.seed` config
5. **package.json**: removed `postinstall`, removed `prisma` block, updated `db:migrate`/`db:push`
6. **lib/db.ts**: added `connectionTimeoutMillis: 5000` to Pool
7. **prisma/seed.ts**: added PrismaPg adapter + Pool pattern
8. **scripts/check-admin.ts**: added PrismaPg adapter + Pool pattern
9. **NextAuth v5**: unchanged (no stable release available)

## Post-Migration Notes

### For local dev
- `prisma generate` ya no corre automáticamente. Correrlo explícitamente después de `npm install`.
- `prisma migrate dev` ya no corre `prisma generate` automáticamente. El script `db:migrate` ya incluye `&& prisma generate`.

### For Vercel deploy
- El build ya corre `next build` que incluye `prisma generate` en el pipeline de Next.js.
- No hay cambios en variables de entorno necesarios.
- SSL warning no bloqueante: en futura actualización de pg, cambiar connection string a `sslmode=verify-full`.
