# Proposal: Upgrade Prisma ORM v6 → v7

## Metadata

- **Change**: `upgrade-prisma-v7`
- **Status**: proposal
- **Created**: 2026-06-06
- **Driver**: Platform stability on Vercel

## Executive Summary

Upgrade Prisma ORM from `^6.19.3` to `v7.8.0` to adopt the recommended version with
better serverless performance (Rust-free client), ESM-native architecture, and
continued support. Prisma v6 enters maintenance mode.

## Motivation

- Prisma v7 is the **recommended version** for production apps per Prisma docs
- **Rust-free client** → faster cold starts on Vercel serverless functions
- **ESM-native** → better compatibility with modern tooling
- **Query caching** (v7.4+) → repeated queries skip compilation after warm-up
- v6 enters maintenance; bug fixes only

## In Scope

1. **Dependencies**: bump `prisma`, `@prisma/client`, `@prisma/adapter-pg` to `^7.8.0`
2. **Schema generator**: change `provider` from `prisma-client-js` to `prisma-client`
3. **package.json scripts**:
   - Remove `postinstall: prisma generate` (no longer automatic)
   - Remove `prisma` block (seed config moves to `prisma.config.ts`)
   - Update `db:migrate`, `db:push` to explicitly run `prisma generate`
4. **prisma.config.ts**: add `seed` config, verify it's correct for v7
5. **Seed script**: ensure `prisma/seed.ts` uses adapter pattern (currently uses bare `new PrismaClient()`)
6. **Scripts**: update `scripts/check-admin.ts` and `scripts/test-adapter.ts` if needed
7. **Pool config**: add explicit timeout to pg Pool to match v6 defaults
8. **Build verification**: ensure all imports from `@/lib/generated/prisma/client` work

## Out of Scope

- **NextAuth v5**: stays at `^5.0.0-beta.31`. No stable release exists.
- **Database schema changes**: zero schema changes
- **Functional changes**: no business logic modified
- **Prisma Accelerate**: not used, not introduced

## Technical Approach

### Migration order

1. **Upgrade dependencies** → install latest versions
2. **Update schema**: `prisma-client-js` → `prisma-client`
3. **Update prisma.config.ts**: add seed path
4. **Update package.json**: remove prisma block, fix scripts
5. **Run `prisma generate`** → verify client generates correctly
6. **Update seed.ts** → add adapter to PrismaClient
7. **Update scripts** → add adapter to check-admin.ts and test-adapter.ts
8. **Fix Pool config** → add connection timeout
9. **Build & verify** → `npm run build`

### Key changes explained

| Area | v6 | v7 |
|---|---|---|
| Generator provider | `prisma-client-js` | `prisma-client` |
| Output path | Required in v7 (already set ✅) | stays `../lib/generated/prisma` |
| PrismaClient constructor | `new PrismaClient({ adapter })` | same (already correct ✅) |
| datasource.url | in schema | in prisma.config.ts (already moved ✅) |
| Seed config | `package.json` → `prisma.seed` | `prisma.config.ts` → `seed` |
| Postinstall | auto `prisma generate` | removed |
| migrate dev | auto generate + seed | generate + seed explicit |
| Pool timeout | 5s default | pg driver default (0 = no timeout) |

## Files Affected

| File | Change |
|---|---|
| `package.json` | Bump deps, remove `postinstall`, remove `prisma` block, fix scripts |
| `prisma/schema.prisma` | provider → `prisma-client` |
| `prisma.config.ts` | Add `seed` config |
| `prisma/seed.ts` | Add adapter to PrismaClient constructor |
| `scripts/check-admin.ts` | Add adapter to PrismaClient constructor |
| `scripts/test-adapter.ts` | Minor fixes if needed |
| `lib/db.ts` | Add pool timeout config |
| `openspec/changes/upgrade-prisma-v7/` | New spec, design, tasks |

## Risks and Rollback

### Risks

| Risk | Mitigation |
|---|---|
| Pool timeout defaults | Explicitly set `connectionTimeoutMillis: 5000` on Pool |
| SSL cert validation | Add `?sslmode=require` to connection string if needed |
| Generated client path changes | Output path stays the same ✅ |
| Seed breaks without adapter | Fix seed to use same adapter as db.ts |

### Rollback

```bash
git revert HEAD
npm install  # reinstalls v6 deps
```

Schema is unchanged → zero database migration needed.

## Success Criteria

- [ ] `npm run build` passes with zero errors
- [ ] `prisma generate` outputs to `lib/generated/prisma/` without warnings
- [ ] Login flow works on local and Vercel
- [ ] All CRUD operations work (products, clients, orders, reports)
- [ ] Seed script runs successfully

## Estimated Size

~8 files modified, ~100-150 lines changed total. Well within 400-line budget.
