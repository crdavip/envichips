# Spec: Upgrade Prisma ORM v6 → v7

## Requirements

### R1: Dependencies updated
- `prisma` bumped from `^6.19.3` to `^7.8.0`
- `@prisma/client` bumped from `^6.19.3` to `^7.8.0`
- `@prisma/adapter-pg` bumped from `^6.19.3` to `^7.8.0`
- `dotenv` remains as dev dependency (already used in prisma.config.ts)

### R2: Schema generator migrated
- Generator provider changes from `prisma-client-js` to `prisma-client`
- Output path stays `../lib/generated/prisma`
- No `previewFeatures` changes needed

### R3: package.json scripts updated
- `postinstall` script removed (v7 removes auto-generate hook)
- `prisma` block removed (seed config moved to prisma.config.ts)
- `db:migrate` updated to `prisma migrate dev && prisma generate`
- `db:push` updated to `prisma db push && prisma generate`

### R4: prisma.config.ts seed config added
- Add `seed` field pointing to `prisma/seed.ts`

### R5: Seed script uses adapter
- `prisma/seed.ts` uses same PrismaPg adapter + Pool pattern as `lib/db.ts`

### R6: Scripts updated
- `scripts/check-admin.ts` uses adapter pattern
- `scripts/test-adapter.ts` uses adapter pattern

### R7: Pool timeout configured
- pg Pool sets `connectionTimeoutMillis: 5000` to match v6 default

### R8: Build succeeds
- `npm run build` passes with zero errors
- `prisma generate` outputs to expected path

## Non-requirements
- No schema changes (models, enums, relations stay identical)
- No functional changes (business logic unchanged)
- No NextAuth changes
- No database migrations needed

## Scenarios

### Happy path
1. User runs `npm install` → deps installed, no postinstall hook needed
2. User runs `prisma generate` → client generated at `lib/generated/prisma/`
3. User runs `npm run build` → succeeds
4. App starts, login works, all CRUD queries work

### Pool timeout scenario
- If pg connection hangs, the 5000ms timeout prevents infinite wait
- If timeout is hit, error is clear and actionable

### Seed scenario
- `prisma db seed` uses adapter+pool, same as runtime
- No mismatch between dev and prod behavior
