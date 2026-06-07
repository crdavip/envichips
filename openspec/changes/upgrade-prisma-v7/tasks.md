# Tasks: Upgrade Prisma ORM v6 → v7

## Task List

### T1: Upgrade dependencies
- [x] Bump `prisma`, `@prisma/client`, `@prisma/adapter-pg` to `^7.8.0`
- [x] Run `npm install`
- **Files**: `package.json`

### T2: Update schema generator
- [x] Change `prisma-client-js` to `prisma-client`
- [x] Remove `url` from datasource block (no longer supported in v7 schema files)
- **Files**: `prisma/schema.prisma`

### T3: Update prisma.config.ts
- [x] Add seed config under `migrations.seed`
- [x] Note: seed goes under `migrations` not at top level in v7
- **Files**: `prisma.config.ts`

### T4: Fix package.json scripts
- [x] Remove `postinstall`
- [x] Remove `prisma` block
- [x] Add `&& prisma generate` to `db:migrate` and `db:push`
- **Files**: `package.json`

### T5: Fix Pool timeout
- [x] Add `connectionTimeoutMillis: 5000` to pg Pool
- **Files**: `lib/db.ts`

### T6: Fix seed script
- [x] Add PrismaPg adapter + Pool pattern
- **Files**: `prisma/seed.ts`

### T7: Fix helper scripts
- [x] Add adapter pattern to check-admin.ts
- [x] Verify test-adapter.ts already has adapter pattern ✓
- **Files**: `scripts/check-admin.ts`, `scripts/test-adapter.ts`

### T8: Generate and verify
- [x] Run `prisma generate` — successful
- [x] Run `npm run build` — successful
- **Note**: Had to also remove `url` from schema datasource (v7 breaking change)

## Dependencies
- T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
- T1 is prerequisite for all
- T8 is final verification

## Review Workload Forecast
- ~8 files modified
- ~120-150 lines changed
- **Budget**: under 400 lines ✅
- **Chained PRs**: not needed (single atomic change)

## Delivery Strategy
- Single PR ✅
- Size: small/medium
