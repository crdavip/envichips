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
//  PRODUCTOS — 50 from Excel + 4 OTRO
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
  { nombre: "Papa Limón 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2250, precio: 2800, stockActual: 50, stockMinimo: 10 },
  { nombre: "Papa Natural 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2250, precio: 2800, stockActual: 30, stockMinimo: 10 },
  { nombre: "Papa Pimienta 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2300, precio: 2800, stockActual: 25, stockMinimo: 8 },
  { nombre: "Papa Mayonesa 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2300, precio: 2800, stockActual: 20, stockMinimo: 8 },
  { nombre: "Papa BBQ Dulce 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 15, stockMinimo: 5 },
  { nombre: "Papa BBQ 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 15, stockMinimo: 5 },
  { nombre: "Papas Pollo 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 12, stockMinimo: 5 },
  { nombre: "Papa Chili 65g", categoria: CAT.PAPA, presentacion: PRES.G65, costo: 2200, precio: 2800, stockActual: 10, stockMinimo: 5 },
  { nombre: "Plátano Limón 65g", categoria: CAT.PLATANO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 30, stockMinimo: 10 },
  { nombre: "Plátano Natural 65g", categoria: CAT.PLATANO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 25, stockMinimo: 10 },
  { nombre: "Maduro Limón 65g", categoria: CAT.MADURO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 20, stockMinimo: 8 },
  { nombre: "Maduro Natural 65g", categoria: CAT.MADURO, presentacion: PRES.G65, costo: 2100, precio: 2700, stockActual: 25, stockMinimo: 8 },
  { nombre: "Chicharrón Natural 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1900, precio: 2500, stockActual: 40, stockMinimo: 15 },
  { nombre: "Chicharrón Limón 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1950, precio: 2500, stockActual: 30, stockMinimo: 10 },
  { nombre: "Chicharrón BBQ 65g", categoria: CAT.CHICHARRON, presentacion: PRES.G65, costo: 1950, precio: 2500, stockActual: 15, stockMinimo: 8 },
  { nombre: "Rosquita 50g", categoria: CAT.ROSQUITA, presentacion: PRES.G50, costo: 1750, precio: 2500, stockActual: 60, stockMinimo: 20 },
  { nombre: "Rosca 50g", categoria: CAT.ROSCA, presentacion: PRES.G50, costo: 1750, precio: 2500, stockActual: 50, stockMinimo: 20 },
  { nombre: "Detodito Limón 65g", categoria: CAT.DETODITO, presentacion: PRES.G65, costo: 2600, precio: 3000, stockActual: 25, stockMinimo: 10 },
  { nombre: "Detodito 65g", categoria: CAT.DETODITO, presentacion: PRES.G65, costo: 2600, precio: 3000, stockActual: 20, stockMinimo: 10 },
  { nombre: "Aritos 65g", categoria: CAT.ARITOS, presentacion: PRES.G65, costo: 1900, precio: 2500, stockActual: 35, stockMinimo: 10 },

  // ── 250g ──
  { nombre: "Papa Limón 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 8, stockMinimo: 3 },
  { nombre: "Papa Natural 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 6, stockMinimo: 3 },
  { nombre: "Papa Pimienta 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Papa Mayonesa 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 5, stockMinimo: 2 },
  { nombre: "Papa BBQ Dulce 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 3, stockMinimo: 2 },
  { nombre: "Papa BBQ 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 3, stockMinimo: 2 },
  { nombre: "Papas Pollo 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Papa Chili 250g", categoria: CAT.PAPA, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 2, stockMinimo: 2 },
  { nombre: "Plátano Limón 250g", categoria: CAT.PLATANO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 5, stockMinimo: 2 },
  { nombre: "Plátano Natural 250g", categoria: CAT.PLATANO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 5, stockMinimo: 2 },
  { nombre: "Maduro Limón 250g", categoria: CAT.MADURO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Maduro Natural 250g", categoria: CAT.MADURO, presentacion: PRES.G250, costo: 6750, precio: 9000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Aritos 250g", categoria: CAT.ARITOS, presentacion: PRES.G250, costo: 7500, precio: 9000, stockActual: 5, stockMinimo: 3 },
  { nombre: "Chicharrín 250g", categoria: CAT.OTRO, presentacion: PRES.G250, costo: 14500, precio: 17000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Chicharrín Limón 250g", categoria: CAT.OTRO, presentacion: PRES.G250, costo: 14500, precio: 17000, stockActual: 4, stockMinimo: 2 },

  // ── 500g ──
  { nombre: "Papa Limón 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 5, stockMinimo: 2 },
  { nombre: "Papa Natural 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 4, stockMinimo: 2 },
  { nombre: "Papa Pimienta 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 3, stockMinimo: 2 },
  { nombre: "Papa Mayonesa 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 3, stockMinimo: 2 },
  { nombre: "Papa BBQ Dulce 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 2, stockMinimo: 1 },
  { nombre: "Papa BBQ 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 2, stockMinimo: 1 },
  { nombre: "Papas Pollo 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 2, stockMinimo: 1 },
  { nombre: "Papa Chili 500g", categoria: CAT.PAPA, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 2, stockMinimo: 1 },
  { nombre: "Plátano Limón 500g", categoria: CAT.PLATANO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 3, stockMinimo: 1 },
  { nombre: "Plátano Natural 500g", categoria: CAT.PLATANO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 3, stockMinimo: 1 },
  { nombre: "Maduro Limón 500g", categoria: CAT.MADURO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 3, stockMinimo: 1 },
  { nombre: "Maduro Natural 500g", categoria: CAT.MADURO, presentacion: PRES.G500, costo: 13500, precio: 17000, stockActual: 3, stockMinimo: 1 },
  { nombre: "Aritos 500g", categoria: CAT.ARITOS, presentacion: PRES.G500, costo: 15000, precio: 17000, stockActual: 2, stockMinimo: 1 },
  { nombre: "Chicharrín 500g", categoria: CAT.OTRO, presentacion: PRES.G500, costo: 29000, precio: 33000, stockActual: 3, stockMinimo: 1 },
  { nombre: "Chicharrín Limón 500g", categoria: CAT.OTRO, presentacion: PRES.G500, costo: 29000, precio: 33000, stockActual: 3, stockMinimo: 1 },
];

const otrorods: ProductSeed[] = [
  { nombre: "Galleta de Girasol", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 600, precio: 1200, stockActual: 30, stockMinimo: 10 },
  { nombre: "Galleta de Corazón", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 900, precio: 1800, stockActual: 25, stockMinimo: 10 },
  { nombre: "Alfajor", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 1000, precio: 1900, stockActual: 20, stockMinimo: 8 },
  { nombre: "Maní", categoria: CAT.OTRO, presentacion: PRES.OTRO, costo: 550, precio: 1100, stockActual: 40, stockMinimo: 15 },
];

const allProducts = [...products, ...otrorods];

// ────────────────────────────────────────────
//  USUARIOS
// ────────────────────────────────────────────

interface UserSeed {
  nombre: string;
  email: string;
  password: string;
  rol: "SUPERADMIN" | "ADMIN" | "DOMICILIARIO";
  telefono?: string;
  activo: boolean;
}

const usersSeed: UserSeed[] = [
  { nombre: "Admin Envichips", email: "admin@envichips.com", password: "admin123", rol: "SUPERADMIN", telefono: "3001234567", activo: true },
  { nombre: "Julián Flores", email: "julian@envichips.com", password: "domi123", rol: "DOMICILIARIO", telefono: "3013567441", activo: true },
  { nombre: "Isaac Arguelles", email: "isaac@envichips.com", password: "domi123", rol: "DOMICILIARIO", telefono: "3162548104", activo: true },
  { nombre: "Villa", email: "villa@envichips.com", password: "domi123", rol: "DOMICILIARIO", telefono: "3109876543", activo: true },
];

// ────────────────────────────────────────────
//  CLIENTES — from Excel + invented data
// ────────────────────────────────────────────

interface ClientSeed {
  idCliente: string;
  nombreCompleto: string;
  telefono?: string;
  direccion?: string;
  tipoDoc?: "CC" | "TI" | "CE" | "NIT" | "PASAPORTE";
  numeroDoc?: string;
  estado: string;
  limiteCredito?: number;
  notas?: string;
}

function cl(
  id: number, nombre: string, tel?: string, dir?: string,
  docTipo?: "CC" | "TI" | "CE" | "NIT" | "PASAPORTE", docNum?: string,
  estado = "AL_DÍA", limite?: number, notas?: string,
): ClientSeed {
  return { idCliente: `CLI-${id}`, nombreCompleto: nombre, telefono: tel, direccion: dir, tipoDoc: docTipo, numeroDoc: docNum, estado, limiteCredito: limite, notas };
}

const clientsSeed: ClientSeed[] = [
  cl(1001, "Isaac Arguelles", "3162548104", "Cr 39 A #40 F Sur 02", "CC", "1045789632", "EN_DEUDA", 1000000, "Cliente frecuente, paga quincenal"),
  cl(1002, "Julián Flores", "3013567441", "Las Cometas", "CC", "1020456789", "EN_DEUDA", 500000),
  cl(1003, "Daniel Escudero Bar", "3134480967", "La Mina", "CC", "1032567890", "EN_DEUDA", 200000),
  cl(1004, "César", "3123456789", "Barrio Mesa", "CC", "1045678901", "AL_DÍA", 300000, "Paga al día"),
  cl(1005, "Iván Dorado", "3145678901", "El Dorado", "CC", "1056789012", "EN_DEUDA", 200000),
  cl(1006, "La Piñata", "3156789012", "Parque Principal", "NIT", "901234567", "EN_DEUDA", 300000, "Tienda de barrio"),
  cl(1007, "La Locha", "3167890123", "San Javier", "NIT", "902345678", "EN_DEUDA", 200000),
  cl(1008, "Robinson", "3178901234", "San Antonio", "CC", "1067890123", "EN_DEUDA", 500000),
  cl(1009, "Cevichería M&L", "3189012345", "Parque del Agua", "NIT", "903456789", "EN_DEUDA", 300000, "Pago quincenal"),
  cl(1010, "Angy Tienda Mina", "3136343103", "La Mina", "NIT", "904567890", "AL_DÍA", 200000),
  cl(1011, "El Colonial", "3190123456", "Barrio Mesa", "NIT", "905678901", "EN_DEUDA", 150000),
  cl(1012, "Gloria", "3201234567", "Belén", "CC", "1078901234", "EN_DEUDA", 200000),
  cl(1013, "Acá Te Espero", "3212345678", "La América", "NIT", "906789012", "EN_DEUDA", 250000, "Tienda de barrio"),
  cl(1014, "La Placita Móvil", "3223456789", "Robledo", "NIT", "907890123", "EN_DEUDA", 150000),
  cl(1015, "La Mona", "3234567890", "Castilla", "CC", "1089012345", "AL_DÍA", 200000),
  cl(1016, "Mekatos", "3245678901", "Aranjuez", "NIT", "908901234", "AL_DÍA", 300000, "Distribuidora"),
  cl(1017, "El Loco", "3256789012", "Buenos Aires", "CC", "1090123456", "AL_DÍA", 200000),
  cl(1018, "Checho", "3267890123", "Manrique", "CC", "1101234567", "AL_DÍA", 150000),
  cl(1019, "Piedad", "3278901234", "La Candelaria", "CC", "1112345678", "AL_DÍA", 200000),
  cl(1020, "Gozadera", "3289012345", "Envigado", "NIT", "909012345", "AL_DÍA", 300000),
  cl(1021, "El Terriano", "3290123456", "Itagüí", "NIT", "910123456", "AL_DÍA", 150000),
  cl(1022, "Distrifruto", "3301234567", "Sabaneta", "NIT", "911234567", "AL_DÍA", 400000, "Distribuidora grande"),
  cl(1023, "Simpson", "3312345678", "Bello", "CC", "1123456789", "AL_DÍA", 200000),
  cl(1024, "Del Cazzar", "3323456789", "La Estrella", "CC", "1134567890", "AL_DÍA", 250000),
  cl(1025, "María Isabel (Tía)", "3334567890", "Caldas", "CC", "1145678901", "EN_DEUDA", 200000),
  cl(1026, "Galpón", "3345678901", "San Cristóbal", "NIT", "912345678", "AL_DÍA", 300000),
  cl(1027, "Celeste", "3356789012", "Belén Rincón", "CC", "1156789012", "EN_DEUDA", 150000),
  cl(1028, "Helados y Más", "3367890123", "La 33", "NIT", "913456789", "EN_DEUDA", 200000),
  cl(1029, "Gustamar", "3378901234", "El Poblado", "NIT", "914567890", "EN_DEUDA", 150000),
  cl(1030, "La Buena Esquina", "3389012345", "Laureles", "NIT", "915678901", "EN_DEUDA", 200000),
  cl(1031, "Anderson Roldán", "3390123456", "Florida", "CC", "1167890123", "AL_DÍA", 200000),
  cl(1032, "Hugo Itagüí", "3401234567", "Itagüí", "CC", "1178901234", "EN_DEUDA", 150000),
  cl(1033, "Tala", "3412345678", "San Javier", "CC", "1189012345", "EN_DEUDA", 200000),
  cl(1034, "Villa", "3423456789", "Castilla", "CC", "1190123456", "EN_DEUDA", 150000),
  cl(1035, "Camilo", "3434567890", "Robledo", "CC", "1201234567", "EN_DEUDA", 150000),
  cl(1036, "La Monita de La Paz", "3445678901", "La Paz", "CC", "1212345678", "EN_DEUDA", 150000),
  // Extra clients from domicilios data not in original client list
  cl(1037, "Angy", "3456789012", "La Mina", "CC", "1223456789", "AL_DÍA", 200000),
  cl(1038, "Pilar", "3467890123", "Alcalá", "CC", "1234567890", "AL_DÍA", 150000),
  cl(1039, "Don J", "3478901234", "Belén", "CC", "1245678901", "AL_DÍA", 200000),
  cl(1040, "Pastora", "3489012345", "Caldas", "CC", "1256789012", "AL_DÍA", 250000),
  cl(1041, "Bulevar", "3490123456", "La 44", "NIT", "916789012", "AL_DÍA", 300000),
  cl(1042, "Milla de Oro", "3501234567", "El Centro", "NIT", "917890123", "AL_DÍA", 400000),
  cl(1043, "Richard", "3512345678", "Sabaneta", "CC", "1267890123", "AL_DÍA", 300000),
  cl(1044, "Fruver Mesa", "3523456789", "La Mesa", "NIT", "918901234", "AL_DÍA", 200000),
  cl(1045, "Emmanuel Itagüí", "3534567890", "Itagüí", "NIT", "919012345", "AL_DÍA", 250000),
  cl(1046, "Escocia", "3545678901", "Laureles", "NIT", "920123456", "AL_DÍA", 200000),
  cl(1047, "Bar Social", "3556789012", "Envigado", "NIT", "921234567", "AL_DÍA", 300000),
  cl(1048, "Cascanueces", "3567890123", "Manrique", "NIT", "922345678", "AL_DÍA", 150000),
];

// ────────────────────────────────────────────
//  COMPRAS — from Excel Compras sheet
// ────────────────────────────────────────────

interface CompraItemSeed {
  prodIdx: number; // index into allProducts array (0-based)
  cantidad: number;
}

interface CompraSeed {
  fecha: string; // "YYYY-MM-DD"
  proveedor: string;
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "FIADO";
  items: CompraItemSeed[];
}

const comprasSeed: CompraSeed[] = [
  // Nov 9 — primera compra grande
  { fecha: "2025-11-09", proveedor: "Frades", metodoPago: "TRANSFERENCIA", items: [
    { prodIdx: 0, cantidad: 82 },   // Papa Limón 65g
    { prodIdx: 1, cantidad: 30 },   // Papa Natural 65g
    { prodIdx: 2, cantidad: 92 },   // Papa Pimienta 65g
    { prodIdx: 3, cantidad: 3 },    // Papa Mayonesa 65g
    { prodIdx: 4, cantidad: 22 },   // Papa BBQ Dulce 65g
    { prodIdx: 5, cantidad: 23 },   // Papa BBQ 65g
    { prodIdx: 6, cantidad: 12 },   // Papas Pollo 65g
    { prodIdx: 7, cantidad: 22 },   // Papa Chili 65g
    { prodIdx: 8, cantidad: 74 },   // Plátano Limón 65g
    { prodIdx: 9, cantidad: 37 },   // Plátano Natural 65g
    { prodIdx: 10, cantidad: 51 },  // Maduro Limón 65g
    { prodIdx: 11, cantidad: 113 }, // Maduro Natural 65g
    { prodIdx: 12, cantidad: 213 }, // Chicharrón Natural 65g
    { prodIdx: 13, cantidad: 84 },  // Chicharrón Limón 65g
    { prodIdx: 15, cantidad: 92 },  // Rosquita 50g
    { prodIdx: 16, cantidad: 215 }, // Rosca 50g
    { prodIdx: 17, cantidad: 28 },  // Detodito Limón
    { prodIdx: 18, cantidad: 48 },  // Detodito
    { prodIdx: 19, cantidad: 150 }, // Aritos 65g
  ]},
  // Nov 10
  { fecha: "2025-11-10", proveedor: "Frades", metodoPago: "TRANSFERENCIA", items: [
    { prodIdx: 0, cantidad: 298 },  // Papa Limón 65g
    { prodIdx: 1, cantidad: 294 },  // Papa Natural 65g
    { prodIdx: 2, cantidad: 100 },  // Papa Pimienta 65g
    { prodIdx: 3, cantidad: 100 },  // Papa Mayonesa 65g
  ]},
  // Nov 20
  { fecha: "2025-11-20", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 200 },
    { prodIdx: 1, cantidad: 196 },
    { prodIdx: 2, cantidad: 50 },
    { prodIdx: 3, cantidad: 49 },
    { prodIdx: 19, cantidad: 48 },
    { prodIdx: 7, cantidad: 20 },
    { prodIdx: 6, cantidad: 40 },
    { prodIdx: 5, cantidad: 30 },
    { prodIdx: 8, cantidad: 30 },
    { prodIdx: 9, cantidad: 50 },
    { prodIdx: 10, cantidad: 30 },
    { prodIdx: 11, cantidad: 100 },
    { prodIdx: 17, cantidad: 30 },
  ]},
  // Nov 21
  { fecha: "2025-11-21", proveedor: "Tucanas", metodoPago: "EFECTIVO", items: [
    { prodIdx: 12, cantidad: 300 },
    { prodIdx: 13, cantidad: 100 },
    { prodIdx: 14, cantidad: 30 },   // Chicharrón BBQ 65g
  ]},
  // Nov 26
  { fecha: "2025-11-26", proveedor: "Frades", metodoPago: "TRANSFERENCIA", items: [
    { prodIdx: 0, cantidad: 299 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 97 },
    { prodIdx: 3, cantidad: 99 },
    { prodIdx: 19, cantidad: 98 },
  ]},
  // Nov 28
  { fecha: "2025-11-28", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 7, cantidad: 20 },
    { prodIdx: 6, cantidad: 40 },
    { prodIdx: 5, cantidad: 30 },
    { prodIdx: 4, cantidad: 50 },
    { prodIdx: 9, cantidad: 50 },
    { prodIdx: 8, cantidad: 30 },
    { prodIdx: 11, cantidad: 50 },
  ]},
  // Dec 4
  { fecha: "2025-12-04", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 300 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 100 },
    { prodIdx: 3, cantidad: 50 },
    { prodIdx: 19, cantidad: 100 },
  ]},
  // Dec 6 — compra grande con 250g y 500g
  { fecha: "2025-12-06", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 8, cantidad: 30 },
    { prodIdx: 9, cantidad: 50 },
    { prodIdx: 10, cantidad: 30 },
    { prodIdx: 11, cantidad: 50 },
    { prodIdx: 15, cantidad: 600 },
    { prodIdx: 16, cantidad: 600 },
    { prodIdx: 18, cantidad: 30 },
    { prodIdx: 20, cantidad: 6 },   // Papa Limón 250g
    { prodIdx: 21, cantidad: 6 },
    { prodIdx: 23, cantidad: 6 },   // Papa Mayonesa 250g
    { prodIdx: 26, cantidad: 6 },   // Papas Pollo 250g
    { prodIdx: 28, cantidad: 6 },   // Plátano Limón 250g
    { prodIdx: 29, cantidad: 6 },   // Plátano Natural 250g
    { prodIdx: 30, cantidad: 6 },   // Maduro Limón 250g
    { prodIdx: 31, cantidad: 6 },   // Maduro Natural 250g
    { prodIdx: 33, cantidad: 6 },   // Chicharrín 250g
    { prodIdx: 34, cantidad: 6 },   // Chicharrín Limón 250g
    { prodIdx: 32, cantidad: 6 },   // Aritos 250g
    { prodIdx: 35, cantidad: 2 },   // Papa Limón 500g
    { prodIdx: 36, cantidad: 2 },
    { prodIdx: 43, cantidad: 2 },   // Plátano Limón 500g
    { prodIdx: 44, cantidad: 2 },   // Plátano Natural 500g
    { prodIdx: 45, cantidad: 2 },   // Maduro Limón 500g
    { prodIdx: 46, cantidad: 2 },   // Maduro Natural 500g
    { prodIdx: 47, cantidad: 2 },   // Chicharrín 500g
    { prodIdx: 48, cantidad: 2 },   // Chicharrín Limón 500g
  ]},
  // Dec 9
  { fecha: "2025-12-09", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 300 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 150 },
    { prodIdx: 3, cantidad: 50 },
    { prodIdx: 19, cantidad: 100 },
  ]},
  // Dec 10
  { fecha: "2025-12-10", proveedor: "Tucanas", metodoPago: "EFECTIVO", items: [
    { prodIdx: 12, cantidad: 300 },
    { prodIdx: 13, cantidad: 50 },
    { prodIdx: 14, cantidad: 30 },
  ]},
  // Dec 12
  { fecha: "2025-12-12", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 15, cantidad: 3 },
    { prodIdx: 16, cantidad: 3 },
  ]},
  // Enero 2026
  { fecha: "2026-01-15", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 200 },
    { prodIdx: 1, cantidad: 150 },
    { prodIdx: 2, cantidad: 80 },
    { prodIdx: 3, cantidad: 50 },
    { prodIdx: 12, cantidad: 200 },
    { prodIdx: 13, cantidad: 100 },
    { prodIdx: 15, cantidad: 100 },
    { prodIdx: 16, cantidad: 100 },
  ]},
  { fecha: "2026-01-21", proveedor: "Tucanas", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 300 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 12, cantidad: 200 },
    { prodIdx: 19, cantidad: 100 },
  ]},
  { fecha: "2026-01-30", proveedor: "Frades", metodoPago: "TRANSFERENCIA", items: [
    { prodIdx: 0, cantidad: 250 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 100 },
    { prodIdx: 3, cantidad: 50 },
    { prodIdx: 12, cantidad: 150 },
    { prodIdx: 15, cantidad: 80 },
    { prodIdx: 16, cantidad: 80 },
    { prodIdx: 19, cantidad: 50 },
  ]},
  // Febrero 2026
  { fecha: "2026-02-05", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 300 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 100 },
    { prodIdx: 3, cantidad: 50 },
    { prodIdx: 19, cantidad: 80 },
  ]},
  { fecha: "2026-02-14", proveedor: "Frades", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 200 },
    { prodIdx: 1, cantidad: 150 },
    { prodIdx: 15, cantidad: 200 },
    { prodIdx: 16, cantidad: 200 },
    { prodIdx: 12, cantidad: 150 },
    { prodIdx: 13, cantidad: 80 },
  ]},
  { fecha: "2026-02-21", proveedor: "Tucanas", metodoPago: "EFECTIVO", items: [
    { prodIdx: 0, cantidad: 200 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 8, cantidad: 50 },
    { prodIdx: 9, cantidad: 50 },
  ]},
  { fecha: "2026-02-28", proveedor: "Frades", metodoPago: "TRANSFERENCIA", items: [
    { prodIdx: 0, cantidad: 300 },
    { prodIdx: 1, cantidad: 200 },
    { prodIdx: 2, cantidad: 100 },
    { prodIdx: 12, cantidad: 200 },
    { prodIdx: 16, cantidad: 150 },
  ]},
];

// ────────────────────────────────────────────
//  PEDIDOS / DOMICILIOS — from Excel domicilios sheet
// ────────────────────────────────────────────

interface PedidoItemSeed {
  prodIdx: number;
  cantidad: number;
}

interface PedidoSeed {
  fecha: string;
  domiciliarioEmail: string;
  clienteIdCliente: string;
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "FIADO";
  total: number;
  estado: "PENDIENTE" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";
  items?: PedidoItemSeed[];
  descuento?: number;
  dineroCobrado?: boolean;
  montoCobrado?: number;
  pagoEntregadoAdmin?: boolean;
}

function ped(
  fecha: string, dom: string, cli: string, total: number,
  estado: "PENDIENTE" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO" = "ENTREGADO",
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "FIADO" = "FIADO",
  cobrado?: boolean, monto?: number, pagadoAdmin?: boolean,
  desc?: number,
): PedidoSeed {
  return { fecha, domiciliarioEmail: dom, clienteIdCliente: cli, total, estado, metodoPago: metodo, dineroCobrado: cobrado, montoCobrado: monto, pagoEntregadoAdmin: pagadoAdmin, descuento: desc };
}

const pedidosSeed: PedidoSeed[] = [
  // Noviembre 2025
  ped("2025-11-11", "julian@envichips.com", "CLI-1001", 30000, "ENTREGADO", "FIADO"),
  ped("2025-11-11", "julian@envichips.com", "CLI-1004", 25000, "ENTREGADO", "EFECTIVO", true, 25000, true),
  ped("2025-11-13", "julian@envichips.com", "CLI-1002", 45000, "ENTREGADO", "FIADO"),
  ped("2025-11-13", "isaac@envichips.com", "CLI-1005", 22500, "ENTREGADO", "FIADO"),
  ped("2025-11-14", "julian@envichips.com", "CLI-1006", 35000, "ENTREGADO", "FIADO"),
  ped("2025-11-14", "isaac@envichips.com", "CLI-1003", 18500, "ENTREGADO", "FIADO"),
  ped("2025-11-15", "julian@envichips.com", "CLI-1008", 52000, "ENTREGADO", "FIADO"),
  ped("2025-11-15", "julian@envichips.com", "CLI-1009", 38000, "ENTREGADO", "FIADO"),
  ped("2025-11-17", "julian@envichips.com", "CLI-1002", 62000, "ENTREGADO", "FIADO"),
  ped("2025-11-17", "isaac@envichips.com", "CLI-1001", 44000, "ENTREGADO", "FIADO"),
  ped("2025-11-21", "julian@envichips.com", "CLI-1007", 28000, "ENTREGADO", "FIADO"),
  ped("2025-11-21", "julian@envichips.com", "CLI-1008", 55000, "ENTREGADO", "FIADO"),
  ped("2025-11-21", "isaac@envichips.com", "CLI-1011", 32000, "ENTREGADO", "FIADO"),
  ped("2025-11-23", "julian@envichips.com", "CLI-1013", 18000, "ENTREGADO", "EFECTIVO", true, 18000, true),

  // Diciembre 2025
  ped("2025-12-01", "julian@envichips.com", "CLI-1002", 48000, "ENTREGADO", "FIADO"),
  ped("2025-12-01", "julian@envichips.com", "CLI-1016", 35000, "ENTREGADO", "FIADO"),
  ped("2025-12-01", "isaac@envichips.com", "CLI-1017", 22000, "ENTREGADO", "EFECTIVO", true, 22000, true),
  ped("2025-12-02", "julian@envichips.com", "CLI-1001", 55000, "ENTREGADO", "FIADO"),
  ped("2025-12-02", "isaac@envichips.com", "CLI-1005", 12000, "ENTREGADO", "FIADO"),
  ped("2025-12-03", "julian@envichips.com", "CLI-1018", 28000, "ENTREGADO", "EFECTIVO", true, 28000, true),
  ped("2025-12-04", "julian@envichips.com", "CLI-1006", 42000, "ENTREGADO", "FIADO"),
  ped("2025-12-04", "isaac@envichips.com", "CLI-1009", 35000, "ENTREGADO", "FIADO"),
  ped("2025-12-05", "julian@envichips.com", "CLI-1020", 38000, "ENTREGADO", "FIADO"),
  ped("2025-12-05", "isaac@envichips.com", "CLI-1010", 25000, "ENTREGADO", "EFECTIVO", true, 25000, true),
  ped("2025-12-06", "julian@envichips.com", "CLI-1002", 65000, "ENTREGADO", "FIADO"),
  ped("2025-12-06", "isaac@envichips.com", "CLI-1003", 18000, "ENTREGADO", "FIADO"),
  ped("2025-12-06", "villa@envichips.com", "CLI-1034", 15000, "ENTREGADO", "EFECTIVO", true, 15000, true),
  ped("2025-12-09", "julian@envichips.com", "CLI-1001", 72000, "ENTREGADO", "FIADO"),
  ped("2025-12-09", "julian@envichips.com", "CLI-1013", 35000, "ENTREGADO", "FIADO"),
  ped("2025-12-09", "isaac@envichips.com", "CLI-1017", 28000, "ENTREGADO", "EFECTIVO", true, 28000, true),
  ped("2025-12-10", "julian@envichips.com", "CLI-1008", 48000, "ENTREGADO", "FIADO"),
  ped("2025-12-10", "isaac@envichips.com", "CLI-1005", 22000, "ENTREGADO", "FIADO"),
  ped("2025-12-12", "julian@envichips.com", "CLI-1012", 38000, "ENTREGADO", "FIADO"),
  ped("2025-12-12", "isaac@envichips.com", "CLI-1006", 31000, "ENTREGADO", "FIADO"),
  ped("2025-12-14", "julian@envichips.com", "CLI-1002", 55000, "ENTREGADO", "FIADO"),
  ped("2025-12-16", "julian@envichips.com", "CLI-1021", 25000, "ENTREGADO", "EFECTIVO", true, 25000, true),
  ped("2025-12-24", "julian@envichips.com", "CLI-1018", 42000, "ENTREGADO", "FIADO"),
  ped("2025-12-24", "isaac@envichips.com", "CLI-1025", 35000, "ENTREGADO", "FIADO"),
  ped("2025-12-26", "julian@envichips.com", "CLI-1033", 28000, "ENTREGADO", "FIADO"),
  ped("2025-12-26", "isaac@envichips.com", "CLI-1011", 37500, "ENTREGADO", "FIADO"),
  ped("2025-12-29", "julian@envichips.com", "CLI-1007", 41000, "ENTREGADO", "FIADO"),
  ped("2025-12-29", "isaac@envichips.com", "CLI-1005", 22000, "ENTREGADO", "FIADO"),

  // Enero 2026
  ped("2026-01-05", "isaac@envichips.com", "CLI-1025", 50800, "ENTREGADO", "FIADO"),
  ped("2026-01-05", "julian@envichips.com", "CLI-1043", 241200, "ENTREGADO", "FIADO"),
  ped("2026-01-06", "julian@envichips.com", "CLI-1042", 201600, "ENTREGADO", "FIADO"),
  ped("2026-01-07", "julian@envichips.com", "CLI-1047", 88000, "ENTREGADO", "FIADO"),
  ped("2026-01-08", "julian@envichips.com", "CLI-1008", 97000, "ENTREGADO", "FIADO"),
  ped("2026-01-08", "isaac@envichips.com", "CLI-1019", 181700, "ENTREGADO", "FIADO"),
  ped("2026-01-09", "julian@envichips.com", "CLI-1016", 226100, "ENTREGADO", "FIADO"),
  ped("2026-01-10", "julian@envichips.com", "CLI-1040", 110900, "ENTREGADO", "FIADO"),
  ped("2026-01-13", "julian@envichips.com", "CLI-1008", 147800, "ENTREGADO", "FIADO"),
  ped("2026-01-14", "julian@envichips.com", "CLI-1008", 123200, "ENTREGADO", "FIADO"),
  ped("2026-01-15", "julian@envichips.com", "CLI-1002", 102700, "ENTREGADO", "FIADO"),
  ped("2026-01-16", "julian@envichips.com", "CLI-1016", 66700, "ENTREGADO", "EFECTIVO", true, 66700, true),
  ped("2026-01-17", "julian@envichips.com", "CLI-1040", 135000, "ENTREGADO", "FIADO"),
  ped("2026-01-19", "isaac@envichips.com", "CLI-1042", 221700, "ENTREGADO", "FIADO"),
  ped("2026-01-21", "julian@envichips.com", "CLI-1007", 40700, "ENTREGADO", "FIADO"),
  ped("2026-01-22", "julian@envichips.com", "CLI-1044", 80200, "ENTREGADO", "FIADO"),
  ped("2026-01-24", "julian@envichips.com", "CLI-1002", 1855600, "ENTREGADO", "FIADO"),
  ped("2026-01-24", "isaac@envichips.com", "CLI-1001", 241400, "ENTREGADO", "FIADO"),
  ped("2026-01-26", "julian@envichips.com", "CLI-1045", 99100, "ENTREGADO", "FIADO"),
  ped("2026-01-28", "julian@envichips.com", "CLI-1046", 75000, "ENTREGADO", "FIADO"),
  ped("2026-01-30", "julian@envichips.com", "CLI-1008", 202000, "ENTREGADO", "FIADO"),
  ped("2026-01-31", "isaac@envichips.com", "CLI-1020", 90000, "ENTREGADO", "FIADO"),

  // Febrero 2026
  ped("2026-02-02", "isaac@envichips.com", "CLI-1042", 194800, "ENTREGADO", "FIADO"),
  ped("2026-02-03", "isaac@envichips.com", "CLI-1001", 674300, "ENTREGADO", "FIADO"),
  ped("2026-02-04", "julian@envichips.com", "CLI-1018", 128500, "ENTREGADO", "EFECTIVO", true, 128500, true),
  ped("2026-02-05", "isaac@envichips.com", "CLI-1008", 199000, "ENTREGADO", "FIADO"),
  ped("2026-02-07", "julian@envichips.com", "CLI-1047", 45300, "ENTREGADO", "FIADO"),
  ped("2026-02-09", "julian@envichips.com", "CLI-1022", 115800, "ENTREGADO", "FIADO"),
  ped("2026-02-10", "julian@envichips.com", "CLI-1027", 32200, "ENTREGADO", "FIADO"),
  ped("2026-02-11", "julian@envichips.com", "CLI-1002", 859800, "ENTREGADO", "FIADO"),
  ped("2026-02-12", "isaac@envichips.com", "CLI-1009", 98700, "ENTREGADO", "FIADO"),
  ped("2026-02-14", "julian@envichips.com", "CLI-1042", 160100, "ENTREGADO", "FIADO"),
  ped("2026-02-16", "julian@envichips.com", "CLI-1008", 149300, "ENTREGADO", "FIADO"),
  ped("2026-02-17", "julian@envichips.com", "CLI-1009", 56000, "ENTREGADO", "FIADO"),
  ped("2026-02-20", "julian@envichips.com", "CLI-1002", 625100, "ENTREGADO", "FIADO"),
  ped("2026-02-20", "isaac@envichips.com", "CLI-1001", 442000, "ENTREGADO", "FIADO"),
  ped("2026-02-21", "isaac@envichips.com", "CLI-1008", 300000, "ENTREGADO", "FIADO"),
  ped("2026-02-23", "julian@envichips.com", "CLI-1002", 466400, "ENTREGADO", "FIADO"),
  ped("2026-02-24", "isaac@envichips.com", "CLI-1016", 121700, "ENTREGADO", "FIADO"),
  ped("2026-02-27", "julian@envichips.com", "CLI-1002", 2925000, "ENTREGADO", "FIADO"),
  ped("2026-02-27", "isaac@envichips.com", "CLI-1001", 1231500, "ENTREGADO", "FIADO"),
  ped("2026-02-28", "isaac@envichips.com", "CLI-1020", 42900, "ENTREGADO", "EFECTIVO", true, 42900, true),

  // Marzo 2026
  ped("2026-03-03", "julian@envichips.com", "CLI-1008", 145600, "ENTREGADO", "FIADO"),
  ped("2026-03-04", "julian@envichips.com", "CLI-1040", 165200, "ENTREGADO", "FIADO"),
  ped("2026-03-05", "julian@envichips.com", "CLI-1043", 230400, "ENTREGADO", "FIADO"),
  ped("2026-03-06", "julian@envichips.com", "CLI-1008", 141200, "ENTREGADO", "FIADO"),
  ped("2026-03-07", "julian@envichips.com", "CLI-1008", 125000, "ENTREGADO", "FIADO"),

  // Pedidos pendientes (en deuda no cobrada aún)
  ped("2026-01-05", "isaac@envichips.com", "CLI-1001", 253800, "PENDIENTE", "FIADO", false),
  ped("2026-01-06", "julian@envichips.com", "CLI-1002", 675300, "PENDIENTE", "FIADO", false),
  ped("2026-01-24", "julian@envichips.com", "CLI-1002", 1855600, "PENDIENTE", "FIADO", false),
  ped("2026-02-27", "julian@envichips.com", "CLI-1002", 2925000, "PENDIENTE", "FIADO", false),
  ped("2026-02-27", "isaac@envichips.com", "CLI-1001", 1231500, "PENDIENTE", "FIADO", false),
];

// ────────────────────────────────────────────
//  MOVIMIENTOS — from Excel Movimientos sheet
// ────────────────────────────────────────────

interface MovimientoSeed {
  fecha: string;
  tipo: "INGRESO" | "GASTO" | "PRESTAMO";
  categoria: "COMPRA_MERCANCIA" | "PAGO_DOMICILIARIO" | "ARRIENDO" | "SERVICIOS" | "COBRO_CARTERA" | "PRESTAMO" | "OTRO";
  monto: number;
  descripcion: string;
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "FIADO";
}

function mov(
  fecha: string, tipo: "INGRESO" | "GASTO" | "PRESTAMO",
  cat: "COMPRA_MERCANCIA" | "PAGO_DOMICILIARIO" | "ARRIENDO" | "SERVICIOS" | "COBRO_CARTERA" | "PRESTAMO" | "OTRO",
  monto: number, desc: string, mp: "EFECTIVO" | "TRANSFERENCIA" | "FIADO" = "EFECTIVO",
): MovimientoSeed {
  return { fecha, tipo, categoria: cat, monto, descripcion: desc, metodoPago: mp };
}

const movimientosSeed: MovimientoSeed[] = [
  // Octubre — inversión inicial
  mov("2025-10-06", "INGRESO", "OTRO", 2172684, "Inversión inicial", "TRANSFERENCIA"),
  mov("2025-10-06", "GASTO", "COMPRA_MERCANCIA", 2172684, "Primera compra de mercancía", "TRANSFERENCIA"),

  // Noviembre
  mov("2025-11-24", "INGRESO", "COBRO_CARTERA", 1419000, "Cobro efectivo 24 nov"),
  mov("2025-11-25", "GASTO", "PAGO_DOMICILIARIO", 70000, "Pago Villa"),
  mov("2025-11-26", "GASTO", "COMPRA_MERCANCIA", 600000, "Compra rosquitas"),
  mov("2025-11-26", "INGRESO", "COBRO_CARTERA", 350000, "Pago Yuli"),
  mov("2025-11-26", "GASTO", "COMPRA_MERCANCIA", 1680000, "Compra Frades", "TRANSFERENCIA"),
  mov("2025-11-26", "GASTO", "PAGO_DOMICILIARIO", 40000, "Pago Weimar"),
  mov("2025-11-26", "GASTO", "OTRO", 10000, "Gasolina"),
  mov("2025-11-26", "GASTO", "OTRO", 35000, "Uber roscas"),
  mov("2025-11-26", "INGRESO", "COBRO_CARTERA", 642100, "Entradas de dinero"),
  mov("2025-11-26", "INGRESO", "COBRO_CARTERA", 67000, "Abona Isaac (CLI-1001)"),
  mov("2025-11-26", "INGRESO", "COBRO_CARTERA", 300000, "Abona Robinson (CLI-1008)"),
  mov("2025-11-27", "INGRESO", "COBRO_CARTERA", 95200, "Entradas de dinero"),
  mov("2025-11-27", "GASTO", "PAGO_DOMICILIARIO", 350000, "Pago Yuli"),
  mov("2025-11-27", "GASTO", "COMPRA_MERCANCIA", 527000, "Pago Tucanas"),
  mov("2025-11-28", "INGRESO", "COBRO_CARTERA", 529600, "Cobro Julián Flores (CLI-1002)"),
  mov("2025-11-28", "INGRESO", "COBRO_CARTERA", 291200, "Cobro Isaac (CLI-1001)"),
  mov("2025-11-29", "INGRESO", "COBRO_CARTERA", 395800, "Cobro Villa (CLI-1034)"),
  mov("2025-11-29", "INGRESO", "COBRO_CARTERA", 190300, "Cobro Julián (CLI-1002)"),

  // Diciembre
  mov("2025-12-01", "INGRESO", "COBRO_CARTERA", 144700, "Cobro Julián (CLI-1002)"),
  mov("2025-12-01", "INGRESO", "COBRO_CARTERA", 104000, "Cobro Isaac (CLI-1001)"),
  mov("2025-12-01", "GASTO", "PAGO_DOMICILIARIO", 122250, "Pago Julián domiciliario"),
  mov("2025-12-01", "GASTO", "PAGO_DOMICILIARIO", 122250, "Pago Isaac domiciliario"),
  mov("2025-12-01", "INGRESO", "COBRO_CARTERA", 185500, "Cobro Villa (CLI-1034)"),
  mov("2025-12-06", "GASTO", "COMPRA_MERCANCIA", 600000, "Pago roscas"),
  mov("2025-12-06", "GASTO", "COMPRA_MERCANCIA", 1585000, "Pago Frades"),
  mov("2025-12-06", "INGRESO", "COBRO_CARTERA", 456600, "Cobro Julián (CLI-1002)"),
  mov("2025-12-06", "INGRESO", "COBRO_CARTERA", 171100, "Cobro Isaac (CLI-1001)"),
  mov("2025-12-06", "INGRESO", "COBRO_CARTERA", 175000, "Cobro Villa (CLI-1034)"),
  mov("2025-12-06", "INGRESO", "COBRO_CARTERA", 704000, "Cobro Julián (CLI-1002)"),
  mov("2025-12-09", "INGRESO", "COBRO_CARTERA", 116900, "Cobro Villa (CLI-1034)"),
  mov("2025-12-09", "INGRESO", "COBRO_CARTERA", 341900, "Cobro Isaac (CLI-1001)"),
  mov("2025-12-09", "GASTO", "COMPRA_MERCANCIA", 1265000, "Pago Frades"),
  mov("2025-12-09", "INGRESO", "COBRO_CARTERA", 1113100, "Cobro Julián (CLI-1002)"),
  mov("2025-12-10", "INGRESO", "COBRO_CARTERA", 214000, "Cobro Isaac (CLI-1001)"),
  mov("2025-12-11", "GASTO", "COMPRA_MERCANCIA", 600000, "Compra roscas"),
  mov("2025-12-11", "GASTO", "COMPRA_MERCANCIA", 696000, "Compra chicharrones"),
  mov("2025-12-12", "INGRESO", "COBRO_CARTERA", 274800, "Cobro Villa (CLI-1034)"),
  mov("2025-12-12", "GASTO", "COMPRA_MERCANCIA", 491000, "Pago Tucanas"),
  mov("2025-12-12", "PRESTAMO", "PRESTAMO", 500000, "Préstamo de Julián (CLI-1002) para compras"),
  mov("2025-12-16", "PRESTAMO", "PRESTAMO", 1200000, "Préstamo de Julián (CLI-1002) para Frades"),

  // Enero 2026
  mov("2026-01-15", "GASTO", "ARRIENDO", 500000, "Arriendo 15/01"),
  mov("2026-01-15", "GASTO", "COMPRA_MERCANCIA", 1567250, "Pago Frades"),
  mov("2026-01-15", "GASTO", "COMPRA_MERCANCIA", 531000, "Pago Tucanas"),
  mov("2026-01-15", "GASTO", "SERVICIOS", 200000, "Nevera cuota 1"),
  mov("2026-01-19", "INGRESO", "COBRO_CARTERA", 1368500, "Cobro Julián (CLI-1002)"),
  mov("2026-01-21", "GASTO", "ARRIENDO", 550000, "Arriendo 21/01"),
  mov("2026-01-21", "GASTO", "COMPRA_MERCANCIA", 1660250, "Pago Frades"),
  mov("2026-01-21", "GASTO", "COMPRA_MERCANCIA", 512000, "Pago Tucanas"),
  mov("2026-01-24", "INGRESO", "COBRO_CARTERA", 1855000, "Cobro Julián (CLI-1002)"),
  mov("2026-01-24", "INGRESO", "COBRO_CARTERA", 242000, "Cobro Isaac (CLI-1001)"),
  mov("2026-01-26", "GASTO", "OTRO", 180000, "Compra bolsas"),
  mov("2026-01-30", "GASTO", "COMPRA_MERCANCIA", 1447950, "Pago Frades"),
  mov("2026-01-30", "GASTO", "COMPRA_MERCANCIA", 687200, "Pago Tucanas"),
  mov("2026-01-30", "INGRESO", "COBRO_CARTERA", 500000, "Cobro Julián (CLI-1002)"),
  mov("2026-01-30", "INGRESO", "COBRO_CARTERA", 411000, "Cobro Julián (CLI-1002)"),
  mov("2026-01-30", "GASTO", "SERVICIOS", 190000, "Nevera cuota 2"),

  // Febrero 2026
  mov("2026-02-02", "INGRESO", "COBRO_CARTERA", 579500, "Cobro Julián (CLI-1002)"),
  mov("2026-02-02", "INGRESO", "COBRO_CARTERA", 282400, "Cobro Isaac (CLI-1001)"),
  mov("2026-02-02", "GASTO", "COMPRA_MERCANCIA", 735000, "Pago chicharrones"),
  mov("2026-02-05", "GASTO", "COMPRA_MERCANCIA", 1677750, "Pago Frades"),
  mov("2026-02-05", "GASTO", "COMPRA_MERCANCIA", 713000, "Pago Tucanas"),
  mov("2026-02-06", "GASTO", "OTRO", 232000, "Compra canastillas"),
  mov("2026-02-14", "INGRESO", "COBRO_CARTERA", 1236000, "Cobro Isaac (CLI-1001)"),
  mov("2026-02-14", "INGRESO", "COBRO_CARTERA", 2992000, "Cobro Julián (CLI-1002)"),
  mov("2026-02-14", "GASTO", "COMPRA_MERCANCIA", 1600000, "Compra roscas"),
  mov("2026-02-14", "GASTO", "COMPRA_MERCANCIA", 979000, "Pago Tucanas"),
  mov("2026-02-14", "GASTO", "COMPRA_MERCANCIA", 1772500, "Pago Frades"),
  mov("2026-02-20", "INGRESO", "COBRO_CARTERA", 1160000, "Cobro Julián (CLI-1002)"),
  mov("2026-02-20", "INGRESO", "COBRO_CARTERA", 682500, "Cobro Isaac (CLI-1001)"),
  mov("2026-02-20", "GASTO", "COMPRA_MERCANCIA", 1035000, "Pago Frades"),
  mov("2026-02-21", "INGRESO", "COBRO_CARTERA", 1110000, "Cobro Julián (CLI-1002)"),
  mov("2026-02-21", "GASTO", "COMPRA_MERCANCIA", 842000, "Pago Tucanas"),
  mov("2026-02-21", "GASTO", "ARRIENDO", 1050000, "Arriendo"),
  mov("2026-02-23", "INGRESO", "COBRO_CARTERA", 743200, "Cobro Isaac (CLI-1001)"),
  mov("2026-02-27", "INGRESO", "COBRO_CARTERA", 2925000, "Cobro Julián (CLI-1002)"),
  mov("2026-02-27", "INGRESO", "COBRO_CARTERA", 1231000, "Cobro Isaac (CLI-1001)"),
  mov("2026-02-27", "GASTO", "COMPRA_MERCANCIA", 1577920, "Pago Frades"),
  mov("2026-02-28", "GASTO", "COMPRA_MERCANCIA", 767000, "Pago Tucanas"),
  mov("2026-02-28", "GASTO", "PAGO_DOMICILIARIO", 1000000, "Pago empleados"),
];

// ────────────────────────────────────────────
//  ABONOS — pagos de clientes
// ────────────────────────────────────────────

interface AbonoSeed {
  fecha: string;
  clienteIdCliente: string;
  monto: number;
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "FIADO";
  notas?: string;
}

const abonosSeed: AbonoSeed[] = [
  { fecha: "2025-11-26", clienteIdCliente: "CLI-1001", monto: 67000, metodoPago: "EFECTIVO", notas: "Abono Isaac" },
  { fecha: "2025-11-26", clienteIdCliente: "CLI-1008", monto: 300000, metodoPago: "EFECTIVO", notas: "Abono Robinson" },
  { fecha: "2025-11-28", clienteIdCliente: "CLI-1002", monto: 529600, metodoPago: "EFECTIVO", notas: "Abono Julián Flores" },
  { fecha: "2025-11-28", clienteIdCliente: "CLI-1001", monto: 291200, metodoPago: "EFECTIVO", notas: "Abono Isaac" },
  { fecha: "2025-11-29", clienteIdCliente: "CLI-1034", monto: 395800, metodoPago: "EFECTIVO", notas: "Abono Villa" },
  { fecha: "2025-12-01", clienteIdCliente: "CLI-1002", monto: 144700, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-01", clienteIdCliente: "CLI-1001", monto: 104000, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-06", clienteIdCliente: "CLI-1006", monto: 20000, metodoPago: "EFECTIVO", notas: "Abono La Piñata" },
  { fecha: "2025-12-06", clienteIdCliente: "CLI-1002", monto: 456600, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-06", clienteIdCliente: "CLI-1001", monto: 171100, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-09", clienteIdCliente: "CLI-1001", monto: 341900, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-09", clienteIdCliente: "CLI-1002", monto: 1113100, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-10", clienteIdCliente: "CLI-1001", monto: 214000, metodoPago: "EFECTIVO" },
  { fecha: "2025-12-12", clienteIdCliente: "CLI-1034", monto: 274800, metodoPago: "EFECTIVO", notas: "Villa 2" },
  { fecha: "2026-01-05", clienteIdCliente: "CLI-1001", monto: 253800, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-06", clienteIdCliente: "CLI-1002", monto: 675300, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-07", clienteIdCliente: "CLI-1002", monto: 681000, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-08", clienteIdCliente: "CLI-1002", monto: 1032500, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-09", clienteIdCliente: "CLI-1001", monto: 335600, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-13", clienteIdCliente: "CLI-1002", monto: 472500, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-13", clienteIdCliente: "CLI-1001", monto: 289000, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-14", clienteIdCliente: "CLI-1001", monto: 279900, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-15", clienteIdCliente: "CLI-1001", monto: 279100, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-19", clienteIdCliente: "CLI-1002", monto: 1368500, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-19", clienteIdCliente: "CLI-1001", monto: 221700, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-24", clienteIdCliente: "CLI-1001", monto: 241400, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-24", clienteIdCliente: "CLI-1002", monto: 1855600, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-30", clienteIdCliente: "CLI-1002", monto: 500000, metodoPago: "EFECTIVO" },
  { fecha: "2026-01-30", clienteIdCliente: "CLI-1001", monto: 88600, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-02", clienteIdCliente: "CLI-1002", monto: 579500, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-02", clienteIdCliente: "CLI-1001", monto: 282400, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-02", clienteIdCliente: "CLI-1001", monto: 662400, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-03", clienteIdCliente: "CLI-1001", monto: 674300, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-05", clienteIdCliente: "CLI-1001", monto: 199000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-14", clienteIdCliente: "CLI-1001", monto: 1236000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-14", clienteIdCliente: "CLI-1002", monto: 2992000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-20", clienteIdCliente: "CLI-1002", monto: 1160000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-20", clienteIdCliente: "CLI-1001", monto: 682500, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-21", clienteIdCliente: "CLI-1008", monto: 300000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-23", clienteIdCliente: "CLI-1001", monto: 743200, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-27", clienteIdCliente: "CLI-1002", monto: 2925000, metodoPago: "EFECTIVO" },
  { fecha: "2026-02-27", clienteIdCliente: "CLI-1001", monto: 1231000, metodoPago: "EFECTIVO" },
];

// ────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────

function toDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function pickBestItem(total: number, productosDisponibles: typeof allProducts): PedidoItemSeed[] {
  // Pick 1-2 random-ish products and distribute total
  const idx = Math.floor(Math.abs(Math.sin(total * 13.37)) * productosDisponibles.length);
  const idx2 = (idx + 5) % productosDisponibles.length;

  if (total < 5000) {
    const cant = Math.max(1, Math.floor(total / productosDisponibles[idx].precio));
    return [{ prodIdx: idx, cantidad: cant }];
  }

  const mitad = Math.floor(total / 2);
  const p1 = productosDisponibles[idx];
  const p2 = productosDisponibles[idx2];
  const cant1 = Math.max(1, Math.floor(mitad / p1.precio));
  const restante = total - cant1 * p1.precio;
  const cant2 = Math.max(1, Math.floor(restante / p2.precio));
  return [
    { prodIdx: idx, cantidad: cant1 },
    { prodIdx: idx2, cantidad: Math.max(1, cant2) },
  ];
}

// ────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────

export async function main() {
  console.log("🌱 Seeding Envichips database...\n");

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
  console.log("  ✓ Envichips config");

  // ── 2. Artículos ──
  console.log("\n📦 Artículos...");
  for (const p of allProducts) {
    const existing = await db.articulo.findFirst({ where: { nombre: p.nombre } });
    if (existing) {
      await db.articulo.update({ where: { id: existing.id }, data: p });
    } else {
      await db.articulo.create({ data: p });
    }
  }
  console.log(`  ✓ ${allProducts.length} productos creados/actualizados`);

  // ── 3. Sequence ──
  console.log("\n🔢 Sequence...");
  await db.sequence.upsert({
    where: { year_type: { year: 2026, type: "PEDIDO" } },
    update: {},
    create: { year: 2026, type: "PEDIDO", counter: 0 },
  });
  console.log("  ✓ Sequence PEDIDO/2026 initialized");

  // ── 4. Usuarios ──
  console.log("\n👤 Usuarios...");
  const userRecords: Record<string, { id: string }> = {};
  for (const u of usersSeed) {
    const password = await bcrypt.hash(u.password, 12);
    const record = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nombre: u.nombre,
        email: u.email,
        password,
        rol: u.rol,
        telefono: u.telefono,
        activo: u.activo,
      },
    });
    userRecords[u.email] = record;
    console.log(`  ✓ ${u.nombre} (${u.email})`);
  }

  // ── 5. Clientes ──
  console.log("\n👥 Clientes...");
  const clientRecords: Record<string, { id: string }> = {};
  for (const c of clientsSeed) {
    const record = await db.cliente.upsert({
      where: { idCliente: c.idCliente },
      update: {},
      create: {
        idCliente: c.idCliente,
        nombreCompleto: c.nombreCompleto,
        telefono: c.telefono ?? null,
        direccion: c.direccion ?? null,
        tipoDoc: c.tipoDoc ?? null,
        numeroDoc: c.numeroDoc ?? null,
        estado: c.estado,
        limiteCredito: c.limiteCredito ?? null,
        notas: c.notas ?? null,
      },
    });
    clientRecords[c.idCliente] = record;
  }
  console.log(`  ✓ ${clientsSeed.length} clientes creados`);

  // ── 6. Compras ──
  console.log("\n🛒 Compras...");
  let compraCount = 0;
  for (const c of comprasSeed) {
    const items = c.items.map((ci) => ({
      articuloId: allProducts[ci.prodIdx].nombre,
      cantidad: ci.cantidad,
      costo: allProducts[ci.prodIdx].costo,
      subtotal: ci.cantidad * allProducts[ci.prodIdx].costo,
    }));
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    // Resolve articulo IDs
    const resolvedItems = await Promise.all(
      items.map(async (i) => {
        const art = await db.articulo.findFirst({ where: { nombre: i.articuloId } });
        if (!art) throw new Error(`Artículo no encontrado: ${i.articuloId}`);
        return {
          cantidad: i.cantidad,
          costo: i.costo,
          subtotal: i.subtotal,
          articuloId: art.id,
        };
      }),
    );

    await db.compra.create({
      data: {
        fecha: toDate(c.fecha),
        proveedor: c.proveedor,
        metodoPago: c.metodoPago,
        total,
        registradaPorId: userRecords["admin@envichips.com"].id,
        items: { create: resolvedItems },
      },
    });
    compraCount++;
  }
  console.log(`  ✓ ${compraCount} compras con items creadas`);

  // ── 7. Pedidos ──
  console.log("\n📋 Pedidos...");
  const adminId = userRecords["admin@envichips.com"].id;
  let pedidoCount = 0;

  for (const p of pedidosSeed) {
    const cliente = clientRecords[p.clienteIdCliente];
    if (!cliente) {
      console.log(`  ⚠ Cliente no encontrado: ${p.clienteIdCliente}, saltando pedido`);
      continue;
    }

    const domiciliario = userRecords[p.domiciliarioEmail];
    if (!domiciliario) {
      console.log(`  ⚠ Domiciliario no encontrado: ${p.domiciliarioEmail}, saltando pedido`);
      continue;
    }

    // Get next sequence number
    const seq = await db.sequence.update({
      where: { year_type: { year: 2026, type: "PEDIDO" } },
      data: { counter: { increment: 1 } },
    });
    const numeroPedido = `ENV-2026-${String(seq.counter).padStart(5, "0")}`;

    // Generate items if not provided
    const items = p.items ?? pickBestItem(p.total, allProducts);

    // Resolve items to articulo IDs
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const art = await db.articulo.findFirst({ where: { nombre: allProducts[item.prodIdx].nombre } });
        if (!art) throw new Error(`Artículo no encontrado: ${allProducts[item.prodIdx].nombre}`);
        return {
          articuloId: art.id,
          cantidad: item.cantidad,
          precio: art.precio,
          precioOriginal: art.precio,
          costo: art.costo,
          subtotal: item.cantidad * art.precio,
          ganancia: item.cantidad * (art.precio - art.costo),
        };
      }),
    );

    const subtotal = resolvedItems.reduce((s, i) => s + i.subtotal, 0);
    const descuento = p.descuento ?? 0;

    await db.pedido.create({
      data: {
        numeroPedido,
        fecha: toDate(p.fecha),
        clienteId: cliente.id,
        domiciliarioId: domiciliario.id,
        creadoPorId: adminId,
        estado: p.estado,
        metodoPago: p.metodoPago,
        tipoDescuento: descuento > 0 ? "GLOBAL" : "NINGUNO",
        subtotal,
        descuento,
        total: p.total,
        dineroCobrado: p.dineroCobrado ?? null,
        montoCobrado: p.montoCobrado ?? null,
        pagoEntregadoAdmin: p.pagoEntregadoAdmin ?? false,
        pagoEntregadoEn: p.pagoEntregadoAdmin ? toDate(p.fecha) : null,
        items: { create: resolvedItems },
        historialEstados: {
          create: {
            estadoAntes: "PENDIENTE",
            estadoDespues: p.estado,
            cambiadoPorId: adminId,
            creadoEn: toDate(p.fecha),
          },
        },
      },
    });
    pedidoCount++;
  }
  console.log(`  ✓ ${pedidoCount} pedidos creados`);

  // ── 8. Abonos ──
  console.log("\n💰 Abonos...");
  let abonoCount = 0;
  for (const a of abonosSeed) {
    const cliente = clientRecords[a.clienteIdCliente];
    if (!cliente) continue;

    await db.abono.create({
      data: {
        clienteId: cliente.id,
        monto: a.monto,
        fecha: toDate(a.fecha),
        metodoPago: a.metodoPago,
        registradoPorId: adminId,
        notas: a.notas ?? null,
      },
    });
    abonoCount++;
  }
  console.log(`  ✓ ${abonoCount} abonos creados`);

  // ── 9. Movimientos ──
  console.log("\n💳 Movimientos de caja...");
  let movCount = 0;
  for (const m of movimientosSeed) {
    await db.movimiento.create({
      data: {
        fecha: toDate(m.fecha),
        tipo: m.tipo,
        categoria: m.categoria,
        monto: m.monto,
        descripcion: m.descripcion,
        metodoPago: m.metodoPago,
        registradoPorId: adminId,
      },
    });
    movCount++;
  }
  console.log(`  ✓ ${movCount} movimientos creados`);

  // ── Done ──
  console.log("\n✅ Seed complete!");
  console.log(`   ${allProducts.length} productos · 4 usuarios · ${clientsSeed.length} clientes`);
  console.log(`   ${compraCount} compras · ${pedidoCount} pedidos · ${abonoCount} abonos · ${movCount} movimientos`);
}

// Allow direct execution: npx tsx prisma/seed.dev.ts
const isDirectRun = process.argv[1]?.includes("seed.dev");
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
