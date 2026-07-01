# Design: Cambiar Contraseña desde Configuración

## Technical Approach

Add a `changePassword()` service function in `lib/services/usuarios.ts`, a `changePasswordSchema` in validations, a `changePasswordAction` server action in `configuracion/actions.ts`, and a `ChangePasswordForm` component. Modify the config page to render the form for all roles (SUPERADMIN sees both ConfigForm + ChangePasswordForm). On success, the client calls `signOut({ callbackUrl: '/login' })` to invalidate the JWT.

## Architecture Decisions

### Decision: Own-user-only enforcement

**Choice**: Server action derives `userId` from `session.user.id` — never from form data.
**Alternatives considered**: Accepting userId as a hidden field; accepting it as a URL param.
**Rationale**: No client-supplied identifier can be trusted for ownership. Session is the only authoritative source. This prevents privilege escalation by design.
**Tradeoff**: Only the authenticated user can change their own password — no admin-override flow (excluded by scope).

### Decision: signOut() for JWT invalidation

**Choice**: Client-side `signOut({ callbackUrl: '/login' })` from `next-auth/react` after successful change.
**Alternatives considered**: Server-side session revocation via database token blacklist; JWT short expiry + refresh token rotation.
**Rationale**: NextAuth v5 with JWT strategy has no server-side invalidation (JWT is stateless). signOut() clears the httpOnly cookie, forcing re-login. Simplest correct approach.

### Decision: Generic error for wrong current password

**Choice**: `"Contraseña actual incorrecta"` regardless of whether the user exists in DB.
**Alternatives considered**: Different errors for "user not found" vs "password mismatch"; `"Credenciales inválidas"`.
**Rationale**: Prevents user enumeration. The userId comes from session (already authenticated), so existence is guaranteed — but the generic message is still the right defensive practice.

### Decision: No rate limiting

**Choice**: Defer rate limiting to a future cross-cutting concern.
**Rationale**: The project has no rate-limiting infrastructure. Adding it per-endpoint now would be premature. Document as a future improvement in security audit.

## Data Flow

```
Client (ChangePasswordForm)
  │ useActionState
  ▼
changePasswordAction (server action)
  │ auth() → session.user
  │ requireAuth(session.user)
  │ changePasswordSchema.safeParse(raw)
  ▼
changePassword(userId, currentPassword, newPassword)  [lib/services/usuarios.ts]
  │ bcrypt.compare(currentPassword, stored.hash) → throws if mismatch
  │ bcrypt.hash(newPassword, 10) → new hash
  │ db.user.update({ where: { id }, data: { password: newHash } })
  │ revalidatePath('/configuracion')
  ▼
Client receives { success: true }
  │ useEffect → signOut({ callbackUrl: '/login' })
  ▼
Redirect to /login — old JWT cookie cleared
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/validations/usuarios.ts` | Modify | Add `changePasswordSchema` with Zod refine for password match |
| `lib/services/usuarios.ts` | Modify | Add `changePassword(userId, current, newPwd)` with bcrypt compare + hash |
| `app/(dashboard)/configuracion/actions.ts` | Modify | Add `changePasswordAction` — auth → requireAuth → Zod → service → revalidatePath |
| `components/configuracion/ChangePasswordForm.tsx` | Create | Client form with useActionState, 3 password fields, signOut on success |
| `app/(dashboard)/configuracion/page.tsx` | Modify | Render ChangePasswordForm for all roles; SUPERADMIN sees both forms |

## Interfaces / Contracts

```typescript
// lib/validations/usuarios.ts — new schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Debe confirmar la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.output<typeof changePasswordSchema>;

// lib/services/usuarios.ts — new service
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void>;

// Return value for server action
type ChangePasswordActionResult =
  | { success: true }
  | { error: string };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `changePassword` service | Mock bcrypt and Prisma. Verify compare called before hash; verify error on mismatch; verify hash with salt rounds 10 |
| Unit | `changePasswordSchema` | Zod edge cases: empty fields, short newPwd, mismatch confirm |
| Integration | `changePasswordAction` | Full cycle with real Prisma test DB: auth session → valid/invalid passwords → verify DB hash changed |
| E2E | Page rendering per role | Manual verification: SUPERADMIN sees 2 cards, ADMIN/DOMICILIARIO see 1 card |
| E2E | signOut redirect | Manual: change password → verify redirect to /login → old password rejected, new password works |

## Migration / Rollout

No migration required. The `User` model already has a `password` field. No schema changes, feature flags, or data backfill needed.

## Open Questions

- [ ] Should the success message on the form say something before signOut fires? The current design calls signOut() immediately on success — the user will briefly see a green success message then get redirected. Consider a brief delay or showing the message before redirect.
