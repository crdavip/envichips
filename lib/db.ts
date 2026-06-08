import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function normalizeConnectionString(url: string): string {
  try {
    // pg v8 treats sslmode=require as an alias for verify-full.
    // uselibpqcompat=true opts into true libpq-compatible behavior:
    // encryption without CA certificate verification, needed in
    // serverless environments (Vercel) where system CA certs may be absent.
    const u = new URL(url);
    u.searchParams.set("sslmode", "require");
    u.searchParams.set("uselibpqcompat", "true");
    return u.toString();
  } catch {
    // Malformed URL — just append params as fallback
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}sslmode=require&uselibpqcompat=true`;
  }
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
