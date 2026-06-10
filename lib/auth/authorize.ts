// ─── Authorization Utilities ───────────────────────────
// Returns string | null so callers decide: redirect, { error }, or conditional render.

export type Rol = "SUPERADMIN" | "ADMIN" | "DOMICILIARIO";

/** Jerarquía: SUPERADMIN (3) > ADMIN (2) > DOMICILIARIO (1) */
export const HIERARCHY: Record<Rol, number> = {
  DOMICILIARIO: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
};

/**
 * Verifica que el usuario tenga al menos uno de los roles requeridos.
 * Retorna string de error si no está autorizado, null si autorizado.
 *
 * @example
 * ```ts
 * const authError = requireRole("ADMIN", session?.user);
 * if (authError) return { error: authError };
 * ```
 */
export function requireRole(
  required: Rol | Rol[],
  user: { rol?: string | null } | null | undefined,
): string | null {
  if (!user?.rol) {
    return "Debe iniciar sesión";
  }

  const roles = Array.isArray(required) ? required : [required];
  const userRol = user.rol as Rol;

  if (!roles.includes(userRol)) {
    return "Acción no permitida para el rol actual";
  }

  return null;
}

/**
 * Verifica que el usuario esté autenticado.
 * Retorna string de error si no, null si ok.
 */
export function requireAuth(
  user: unknown | null | undefined,
): string | null {
  if (!user) {
    return "Debe iniciar sesión";
  }
  return null;
}

/**
 * Verifica si el rol del usuario es >= al mínimo requerido según la jerarquía.
 * Útil para gates en páginas servidor con redirect.
 *
 * @example
 * ```ts
 * if (!session || !roleGte(session.user, "ADMIN")) {
 *   redirect("/no-autorizado");
 * }
 * ```
 */
export function roleGte(
  user: { rol?: string | null } | null | undefined,
  minRol: Rol,
): boolean {
  if (!user?.rol) return false;
  const userLevel = HIERARCHY[user.rol as Rol];
  if (userLevel === undefined) return false;
  return userLevel >= HIERARCHY[minRol];
}
