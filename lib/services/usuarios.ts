import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
} from "@/lib/validations/usuarios";

// ─── TYPES ────────────────────────────────────────

export type UsuarioListado = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  telefono: string | null;
  ultimoAcceso: Date | null;
  creadoEn: Date;
  creadoPorId: string | null;
  creadoPor: { nombre: string } | null;
};

// ─── QUERIES ─────────────────────────────────────

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  telefono: true,
  ultimoAcceso: true,
  creadoEn: true,
  creadoPorId: true,
  creadoPor: { select: { nombre: true } },
} as const;

export async function getUsuarios(): Promise<UsuarioListado[]> {
  return db.user.findMany({
    select: usuarioSelect,
    orderBy: { creadoEn: "desc" },
  });
}

export async function getUsuario(id: string): Promise<UsuarioListado | null> {
  return db.user.findUnique({
    where: { id },
    select: usuarioSelect,
  });
}

export async function getUsuarioByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

// ─── MUTATIONS ───────────────────────────────────

export async function createUsuario(
  data: CreateUsuarioInput,
  creadoPorId: string,
) {
  const password = await bcrypt.hash(data.password, 10);

  return db.user.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password,
      rol: data.rol,
      telefono: data.telefono ?? null,
      creadoPorId,
    },
    select: usuarioSelect,
  });
}

export async function updateUsuario(id: string, data: UpdateUsuarioInput) {
  const updateData: Record<string, unknown> = {};

  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.rol !== undefined) updateData.rol = data.rol;
  if (data.telefono !== undefined) updateData.telefono = data.telefono;

  // Only update password if it's a non-empty string
  if (data.password && data.password.length > 0) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  return db.user.update({
    where: { id },
    data: updateData,
    select: usuarioSelect,
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new Error("Contraseña actual incorrecta");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Contraseña actual incorrecta");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function toggleUsuarioActivo(
  id: string,
  usuarioLogueadoId: string,
) {
  if (id === usuarioLogueadoId) {
    throw new Error("No puedes desactivar tu propio usuario");
  }

  const user = await db.user.findUnique({
    where: { id },
    select: { activo: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return db.user.update({
    where: { id },
    data: { activo: !user.activo },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      telefono: true,
      ultimoAcceso: true,
      creadoEn: true,
      creadoPorId: true,
    },
  });
}
