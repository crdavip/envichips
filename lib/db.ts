import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function normalizeConnectionString(url: string): string {
  // Suppress pg SSL deprecation warning by using explicit sslmode=verify-full.
  // Prisma v7 uses node-pg natively — older `sslmode=require` emits a warning.
  if (url.includes("sslmode=")) {
    return url.replace(/sslmode=\w+/g, "sslmode=verify-full");
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}sslmode=verify-full`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: normalizeConnectionString(process.env.DATABASE_URL ?? ""),
    connectionTimeoutMillis: 5000,
  });
globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);
export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
