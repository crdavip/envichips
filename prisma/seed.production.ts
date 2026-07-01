import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

function normalizeConnectionString(url: string): string {
  if (url.includes("sslmode=")) {
    return url.replace(/sslmode=\w+/g, "sslmode=verify-full");
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}sslmode=verify-full`;
}

const pool = new Pool({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL ?? ""),
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ────────────────────────────────────────────
//  CONSTANTES
// ────────────────────────────────────────────

const CAT = {
  PAPA: "PAPA" as const,
  PLATANO: "PLATANO" as const,
  MADURO: "MADURO" as const,
  CHICHARRON: "CHICHARRON" as const,
  ROSQUITA: "ROSQUITA" as const,
  ROSCA: "ROSCA" as const,
  DETODITO: "DETODITO" as const,
  ARITOS: "ARITOS" as const,
  OTRO: "OTRO" as const,
};

const PRES = {
  G50: "G50" as const,
  G65: "G65" as const,
  G250: "G250" as const,
  G500: "G500" as const,
  OTRO: "OTRO" as const,
};

// ────────────────────────────────────────────
//  PRODUCTOS — 54 artículos (stock 0)
// ────────────────────────────────────────────

interface ProductSeed {
  nombre: string;
  categoria: "PAPA" | "PLATANO" | "MADURO" | "CHICHARRON" | "ROSQUITA" | "ROSCA" | "DETODITO" | "ARITOS" | "OTRO";
  presentacion: "G50" | "G65" | "G250" | "G500" | "OTRO";
  costo: number;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  activo?: boolean;
}

const products: ProductSeed[] = [
  // ── 65g ──
  { nombre: "Papa Limón 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2250, precio: 2800, stockActual: 0, stockMinimo: 10 },
  { nombre: "Papa Natural 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2250, precio: 2800, stockActual: 0, stockMinimo: 10 },
  { nombre: "Papa Pimienta 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2300, precio: 2800, stockActual: 0, stockMinimo: 8 },
  { nombre: "Papa Mayonesa 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2300, precio: 2800, stockActual: 0, stockMinimo: 8 },
  { nombre: "Papa BBQ Dulce 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 0, stockMinimo: 5 },
  { nombre: "Papa BBQ 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 0, stockMinimo: 5 },
  { nombre: "Papas Pollo 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 0, stockMinimo: 5 },
  { nombre: "Papa Chili 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 0, stockMinimo: 5 },
  { nombre: "Plátano Limón 65g", categoria: CAT.PLATANO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 0, stockMinimo: 10 },
  { nombre: "Plátano Natural 65g", categoria: CAT.PLATANO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 0, stockMinimo: 10 },
  { nombre: "Maduro Limón 65g", categoria: CAT.MADURO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 0, stockMinimo: 8 },
  { nombre: "Maduro Natural 65g", categoria: CAT.MADURO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 0, stockMinimo: 8 },
  { nombre: "Chicharrón Natural 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1900, precio: 2500, stockActual: 0, stockMinimo: 15 },
  { nombre: "Chicharrón Limón 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1950, precio: 2500, stockActual: 0, stockMinimo: 10 },
  { nombre: "Chicharrón BBQ 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1950, precio: 2500, stockActual: 0, stockMinimo: 8 },
  { nombre: "Rosquita 50g", categoria: CAT.ROSQUITA, presentacion: PRES.G50, costo: 1750, precio: 2500, stockActual: 0, stockMinimo: 20 },
  { nombre: "Rosca 50g", categoria: CAT.ROSCA, presentacion: PRES.G50, costo: 1750, precio: 2500, stockActual: 0, stockMinimo: 20 },
  { nombre: "Detodito Limón 65g", categoria: CAT.DETODITO, presentacion: PRES.G65, costo: 2600, precio: 3000, stockActual: 0, stockMinimo: 10 },
  { nombre: "Detodito 65g", categoria: CAT.DETODITO, presentacion: PRES.G65, costo: 2600, precio: 3000, stockActual: 0, stockMinimo: 10 },
  { nombre: "Aritos 65g", categoria: CAT.ARITOS, presentacion: PRES.G65, costo: 1900, precio: 2500, stockActual: 0, stockMinimo: 10 },

  // ── 250g ──
  { nombre: "Papa Limón 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 3 },
  { nombre: "Papa Natural 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 3 },
  { nombre: "Papa Pimienta 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa Mayonesa 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa BBQ Dulce 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa BBQ 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papas Pollo 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa Chili 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Plátano Limón 250g", categoria: CAT.PLATANO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Plátano Natural 250g", categoria: CAT.PLATANO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Maduro Limón 250g", categoria: CAT.MADURO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Maduro Natural 250g", categoria: CAT.MADURO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Aritos 250g", categoria: CAT.ARITOS, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 0, stockMinimo: 3 },
  { nombre: "Chicharrín 250g", categoria: CAT.OTRO, presentacion: PRES.G250, costo: 14500, precio: 17000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Chicharrín Limón 250g", categoria: CAT.OTRO, presentacion: PRES.G250, costo: 14500, precio: 17000, stockActual: 0, stockMinimo: 2 },

  // ── 500g ──
  { nombre: "Papa Limón 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa Natural 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa Pimienta 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa Mayonesa 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 2 },
  { nombre: "Papa BBQ Dulce 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Papa BBQ 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Papas Pollo 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Papa Chili 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Plátano Limón 500g", categoria: CAT.PLATANO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Plátano Natural 500g", categoria: CAT.PLATANO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Maduro Limón 500g", categoria: CAT.MADURO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Maduro Natural 500g", categoria: CAT.MADURO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Aritos 500g", categoria: CAT.ARITOS, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Chicharrín 500g", categoria: CAT.OTRO, presentacion: PRES.G500, costo: 29000, precio: 33000, stockActual: 0, stockMinimo: 1 },
  { nombre: "Chicharrín Limón 500g", categoria: CAT.OTRO, presentacion: PRES.G500, costo: 29000, precio: 33000, stockActual: 0, stockMinimo: 1 },
];

const otrorods: ProductSeed[] = [
  { nombre: "Galleta de Girasol", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 600, precio: 1200, stockActual: 0, stockMinimo: 10 },
  { nombre: "Galleta de Corazón", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 900, precio: 1800, stockActual: 0, stockMinimo: 10 },
  { nombre: "Alfajor", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 1000, precio: 1900, stockActual: 0, stockMinimo: 8 },
  { nombre: "Maní", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 550, precio: 1100, stockActual: 0, stockMinimo: 15 },
];

const allProducts = [...products, ...otrorods];

// ────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────

export async function main() {
  console.log("🌱 Seeding Envichips production database...\n");

  // ── 0. Cleanup: delete all demo data in reverse dependency order ──
  console.log("🧹 Cleaning demo data...");
  const adminEmail = process.env.ADMIN_EMAIL || "julianflorez2019@gmail.com";

  await db.pedidoItem.deleteMany();
  await db.historialEstado.deleteMany();
  await db.pedido.deleteMany();
  await db.abono.deleteMany();
  await db.registroVisita.deleteMany();
  await db.compraItem.deleteMany();
  await db.compra.deleteMany();
  await db.movimiento.deleteMany();
  await db.cliente.deleteMany();
  // Delete all users except the SUPERADMIN we're about to create
  await db.user.deleteMany({ where: { email: { not: adminEmail } } });
  console.log("  ✓ Demo data cleaned (clientes, pedidos, compras, movimientos, abonos, users)\n");

  // ── 1. Business Config ──
  console.log("📋 Business Config...");
  await db.businessConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nombreNegocio: "Envichips",
      telefonoFactura: "3001234567",
    },
  });
  console.log("  ✓ BusinessConfig (Envichips)");

  // ── 2. Sequence ──
  console.log("\n🔢 Sequence...");
  await db.sequence.upsert({
    where: { year_type: { year: 2026, type: "PEDIDO" } },
    update: {},
    create: { year: 2026, type: "PEDIDO", counter: 0 },
  });
  console.log("  ✓ Sequence PEDIDO/2026 initialized");

  // ── 3. Artículos ──
  console.log("\n📦 Artículos...");
  for (const p of allProducts) {
    const existing = await db.articulo.findFirst({ where: { nombre: p.nombre } });
    if (existing) {
      await db.articulo.update({ where: { id: existing.id }, data: p });
    } else {
      await db.articulo.create({ data: p });
    }
  }
  console.log(`  ✓ ${allProducts.length} artículos creados/actualizados (stockActual=0)`);

  // ── 4. SUPERADMIN ──
  console.log("\n👤 SUPERADMIN...");
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: {
      nombre: "Admin Envichips",
      password: hashedPassword,
      rol: "SUPERADMIN",
      telefono: "3001234567",
      activo: true,
    },
    create: {
      nombre: "Admin Envichips",
      email: adminEmail,
      password: hashedPassword,
      rol: "SUPERADMIN",
      telefono: "3001234567",
      activo: true,
    },
  });
  console.log(`  ✓ SUPERADMIN (${adminEmail})`);

  // ── Done ──
  console.log("\n✅ Production seed complete!");
  console.log(`   ${allProducts.length} artículos · 1 BusinessConfig · 1 Sequence · 1 SUPERADMIN`);
}

// Allow direct execution: npx tsx prisma/seed.production.ts
const isDirectRun = process.argv[1]?.includes("seed.production");
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error("❌ Production seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
