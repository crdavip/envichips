# Propuesta: Cambiar Contraseña desde Configuración

## Intención

Permitir que cualquier rol autenticado (SUPERADMIN, ADMIN, DOMICILIARIO) cambie su propia contraseña desde `/configuracion`, reemplazando el placeholder actual.

## Alcance

### Incluye
- Formulario "Cambiar Contraseña" para roles no-SUPERADMIN
- SUPERADMIN ve ambos: ConfigForm + ChangePasswordForm
- Server action con verificación de contraseña actual
- Servicio en `lib/services/usuarios.ts`
- Invalidación JWT vía signOut + redirect a login
- Validación Zod: currentPassword requerido, newPassword mín. 6 car.

### Excluye
- Flujo "olvidé contraseña" / reset por email
- Modificaciones al CRUD de usuarios (SUPERADMIN)
- Autenticación de dos factores
- Cambios en modelo de datos

## Capacidades

### Nuevas
- `cambio-contrasena`: formulario, validación, server action y flujo de cambio para todos los roles

### Modificadas
- `configuracion-global`: `/configuracion` ahora renderiza contenido para ADMIN/DOMICILIARIO (password change)

## Enfoque

1. **Server action** (`configuracion/actions.ts`): `changePasswordAction` — auth() → requireAuth() → Zod → bcrypt.compare(current) → bcrypt.hash(new, 10) → update → revalidatePath
2. **Servicio** (`lib/services/usuarios.ts`): `changePassword(userId, currentPassword, newPassword)` verifica current y actualiza hash
3. **Componente**: `ChangePasswordForm.tsx` con useActionState, campos current/new/confirm, validación client-side
4. **Página**: ADMIN/DOMICILIARIO ven ChangePasswordForm; SUPERADMIN ve ambos formularios en Cards separadas
5. **Post-cambio**: signOut() de next-auth/react → redirect a /login

## Áreas Afectadas

| Área | Impacto |
|------|---------|
| `app/(dashboard)/configuracion/page.tsx` | Render condicional por rol |
| `app/(dashboard)/configuracion/actions.ts` | +`changePasswordAction` |
| `components/configuracion/ChangePasswordForm.tsx` | Nuevo componente |
| `lib/services/usuarios.ts` | +`changePassword()` |
| `lib/validations/usuarios.ts` | +`changePasswordSchema` |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Usuario pierde acceso si falla hash | Baja | bcrypt.compare verifica antes de escribir |
| JWT sigue vivo post-cambio | Media | signOut forzado invalida cookie |
| CSRF | Baja | Server Actions tienen protección nativa |

## Rollback

1. Revertir cambios en `actions.ts`, `page.tsx`, servicio y validaciones
2. Eliminar `ChangePasswordForm.tsx`
3. Sin migración de datos (schema intacto)

## Dependencias

Ninguna externa. bcryptjs y next-auth ya instalados.

## Criterios de Éxito

- [ ] ADMIN/DOMICILIARIO ven formulario de cambio en `/configuracion`
- [ ] Contraseña actual incorrecta → error específico
- [ ] Contraseña nueva < 6 car. → error de validación
- [ ] Cambio exitoso → actualiza hash en DB y redirige a `/login` sin sesión
- [ ] SUPERADMIN puede cambiar su contraseña y sigue viendo ConfigForm del negocio
