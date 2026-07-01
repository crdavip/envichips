import { z } from "zod";

export const ROLES = ["SUPERADMIN", "ADMIN", "DOMICILIARIO"] as const;
export const RolEnum = z.enum(ROLES);

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: RolEnum,
  telefono: z.string().optional(),
});

export const updateUsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6).optional().or(z.literal("")),
  rol: RolEnum,
  telefono: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Debe confirmar la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CreateUsuarioInput = z.output<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.output<typeof updateUsuarioSchema>;
export type ChangePasswordInput = z.output<typeof changePasswordSchema>;
