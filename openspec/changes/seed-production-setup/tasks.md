# Tasks: Separación de seed — producción vs desarrollo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1258 (233 lógicas + 1025 copia mecánica) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (seed producción) → PR 2 (router + seed dev) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `seed.production.ts` + `.env.example` | PR 1 | ~200 líneas nuevas; merges a main. seed.ts intacto |
| 2 | Router `seed.ts` + `seed.dev.ts` | PR 2 | seed.ts → router; seed.dev.ts = copia exacta (~1025 líneas, copia mecánica) |

## Fase 1: Base de producción (PR 1 → main)

- [x] F1.1 Crear `prisma/seed.production.ts` con bootstrap: BusinessConfig (Envichips), Sequence (2026/PEDIDO, counter 0), 54 artículos (stockActual=0)
- [x] F1.2 Agregar SUPERADMIN en seed.production.ts: email desde `ADMIN_EMAIL` o default `julianflorez2019@gmail.com`, password desde `ADMIN_PASSWORD` o default `admin123` (bcrypt hash 12)
- [x] F1.3 Agregar `SEED_MODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` a `.env.example`

## Fase 2: Router y seed dev (PR 2 → main)

- [x] F2.1 Crear `prisma/seed.dev.ts` con copia exacta del seed actual (48 clientes, ~22 compras, ~85 pedidos, ~42 abonos, ~68 movimientos)
- [x] F2.2 Refactorizar `prisma/seed.ts` como router: si `SEED_MODE=production` o `NODE_ENV=production` → ejecuta seed.production, si no → ejecuta seed.dev

## Fase 3: Verificación

- [x] F3.1 Verificación estática: seed.dev.ts es copia exacta del original ✅
- [x] F3.2 Verificación estática: seed.production.ts solo bootstrap mínimo ✅
- [x] F3.3 Verificación estática: env var ADMIN_PASSWORD soportado ✅
- [ ] ~~F3.1–F3.3 ejecución contra DB~~ — SKIPPED (no hay DB de prueba disponible)
