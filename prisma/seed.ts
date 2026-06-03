import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const articulos = [
  {
    nombre: "Papa Limón 65g",
    categoria: "PAPA" as const,
    presentacion: "G65" as const,
    costo: 2250,
    precio: 2800,
    stockActual: 50,
    stockMinimo: 10,
  },
  {
    nombre: "Papa Limón 250g",
    categoria: "PAPA" as const,
    presentacion: "G250" as const,
    costo: 4200,
    precio: 5000,
    stockActual: 30,
    stockMinimo: 8,
  },
  {
    nombre: "Papa Limón 500g",
    categoria: "PAPA" as const,
    presentacion: "G500" as const,
    costo: 7500,
    precio: 9000,
    stockActual: 15,
    stockMinimo: 5,
  },
  {
    nombre: "Plátano Maduro 65g",
    categoria: "PLATANO" as const,
    presentacion: "G65" as const,
    costo: 2000,
    precio: 2600,
    stockActual: 40,
    stockMinimo: 10,
  },
  {
    nombre: "Chicharrón Natural 65g",
    categoria: "CHICHARRON" as const,
    presentacion: "G65" as const,
    costo: 2500,
    precio: 3200,
    stockActual: 25,
    stockMinimo: 8,
  },
  {
    nombre: "Rosquita 65g",
    categoria: "ROSQUITA" as const,
    presentacion: "G65" as const,
    costo: 1800,
    precio: 2400,
    stockActual: 60,
    stockMinimo: 15,
  },
  {
    nombre: "Rosca 50g",
    categoria: "ROSCA" as const,
    presentacion: "G50" as const,
    costo: 1500,
    precio: 2000,
    stockActual: 0,
    stockMinimo: 10,
  },
  {
    nombre: "Detodito 65g",
    categoria: "DETODITO" as const,
    presentacion: "G65" as const,
    costo: 2100,
    precio: 2700,
    stockActual: 20,
    stockMinimo: 10,
    activo: false,
  },
  {
    nombre: "Maduro 250g",
    categoria: "MADURO" as const,
    presentacion: "G250" as const,
    costo: 3800,
    precio: 4600,
    stockActual: 8,
    stockMinimo: 10,
  },
  {
    nombre: "Aritos 65g",
    categoria: "ARITOS" as const,
    presentacion: "G65" as const,
    costo: 1900,
    precio: 2500,
    stockActual: 35,
    stockMinimo: 10,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // ── Artículos (idempotent: update if exists, create if not) ──
  for (const a of articulos) {
    const existing = await db.articulo.findFirst({
      where: { nombre: a.nombre },
    });

    if (existing) {
      await db.articulo.update({
        where: { id: existing.id },
        data: a,
      });
      console.log(`  ✓ ${a.nombre} (updated)`);
    } else {
      await db.articulo.create({ data: a });
      console.log(`  ✓ ${a.nombre} (created)`);
    }
  }

  // ── SuperAdmin user ──
  const password = await bcrypt.hash("admin123", 12);
  await db.user.upsert({
    where: { email: "admin@envichips.com" },
    update: {},
    create: {
      nombre: "Admin Envichips",
      email: "admin@envichips.com",
      password,
      rol: "SUPERADMIN",
    },
  });
  console.log("  ✓ SuperAdmin: admin@envichips.com / admin123");

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
