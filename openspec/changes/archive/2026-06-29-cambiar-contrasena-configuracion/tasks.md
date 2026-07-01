# Tasks: Cambiar Contraseña desde Configuración

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR 1 (backend) → PR 2 (frontend) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: validations + service + server action | PR 1 | Base: main. Testable via unit tests without UI. |
| 2 | Frontend: form component + page wiring | PR 2 | Base: main. Depends on PR 1's API. |

## Phase 1: Schema & Service (PR 1)

- [x] 1.1 `lib/validations/usuarios.ts` — Add `changePasswordSchema` with Zod refine (newPassword !== confirmPassword)
- [x] 1.2 `lib/services/usuarios.ts` — Add `changePassword(userId, currentPassword, newPassword)`: fetch user, bcrypt.compare, bcrypt.hash, Prisma update

## Phase 2: Server Action (PR 1)

- [x] 2.1 `app/(dashboard)/configuracion/actions.ts` — Add `changePasswordAction`: auth() → requireAuth → Zod parse → call changePassword service → revalidatePath → return { success: true } or { error }

## Phase 3: Form Component (PR 2)

- [x] 3.1 `components/configuracion/ChangePasswordForm.tsx` — Create client form: useActionState, 3 password fields, client-side Zod validation inline errors, signOut({ callbackUrl: '/login' }) on success

## Phase 4: Page Integration (PR 2)

- [x] 4.1 `app/(dashboard)/configuracion/page.tsx` — SUPERADMIN: ConfigForm card + ChangePasswordForm card side by side; ADMIN/DOMICILIARIO: ChangePasswordForm only; remove Construction placeholder

## Phase 5: Tests

- [x] 5.1 Manual verification: test with each role (no test runner available)
- [x] 5.2 Verify password change updates hash in DB (manual)
- [x] 5.3 Verify wrong current password returns error (manual)
