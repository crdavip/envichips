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

export type CreateUsuarioInput = z.output<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.output<typeof updateUsuarioSchema>;
