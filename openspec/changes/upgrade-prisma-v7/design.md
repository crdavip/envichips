# Design: Upgrade Prisma ORM v6 → v7

## Architecture

The Prisma ORM upgrade is a dependency+configuration change. No structural
changes to the application architecture. The client API (`PrismaClient`,
`PrismaPg`, query methods) is identical between v6 and v7.

### Data flow (unchanged)

```
App Layer (services, actions)
    ↕ imports types from
Prisma Client (@/lib/generated/prisma/client)
    ↕ uses adapter
PrismaPg + pg Pool
    ↕ connects via TCP
PostgreSQL (Neon / Vercel Postgres)
```

### What stays
- PrismaClient instantiation pattern (adapter-based ✅)
- Import paths (`@/lib/generated/prisma/client`) ✅
- Schema models, enums, relations ✅

### What changes
| Component | v6 | v7 |
|---|---|---|
| Generator engine | Rust-based | Rust-free (TypeScript/WASM) |
| Provider name | `prisma-client-js` | `prisma-client` |
| Postinstall hook | auto `prisma generate` | removed |
| migrate+seed | automatic | explicit |
| Pool timeout | 5s implicit | must be explicit |
| Env loading | automatic in CLI | via dotenv in config |

## Detailed Changes

### 1. package.json

```diff
- "postinstall": "prisma generate",
  "db:generate": "prisma generate",
- "db:migrate": "prisma migrate dev",
+ "db:migrate": "prisma migrate dev && prisma generate",
- "db:push": "prisma db push",
+ "db:push": "prisma db push && prisma generate",
- "prisma": { "seed": "tsx prisma/seed.ts" }
```

### 2. schema.prisma

```diff
generator client {
-  provider = "prisma-client-js"
+  provider = "prisma-client"
   output   = "../lib/generated/prisma"
 }
```

### 3. prisma.config.ts

```diff
 export default defineConfig({
   schema: "prisma/schema.prisma",
+  seed: "tsx prisma/seed.ts",
   migrations: { path: "prisma/migrations" },
   datasource: { url: process.env.DATABASE_URL ?? "" },
 });
```

### 4. lib/db.ts

```diff
 const pool =
   globalForPrisma.pool ??
-  new Pool({ connectionString: process.env.DATABASE_URL });
+  new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
```

### 5. prisma/seed.ts (full rewrite of PrismaClient init)

Use same adapter+pool pattern as lib/db.ts instead of bare `new PrismaClient()`.

### 6. scripts/check-admin.ts and test-adapter.ts

Same adapter+pool pattern.

## Rollback Strategy

```bash
git revert HEAD  # reverts all changes in the apply commit
npm install      # reinstalls v6 deps
```

Schema is unchanged → zero database impact.

## Testing Strategy

1. `npm run build` — must pass with zero errors
2. `prisma generate` — must output to expected path
3. `prisma db seed` — must run successfully
4. Manual: login, create order, view reports
