import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function isPrivateHost(hostname: string): boolean {
  // Loopback / local machine
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  // Private IPv4 ranges:
  //   10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const parts = hostname.split(".");
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
  }

  return false;
}

function normalizeConnectionString(url: string): string {
  try {
    // pg v8 treats sslmode=require as an alias for verify-full.
    // uselibpqcompat=true opts into true libpq-compatible behavior:
    // encryption without CA certificate verification, needed in
    // serverless environments (Vercel) where system CA certs may be absent.
    const u = new URL(url);

    // Only enforce SSL for non-local connections.
    // Local PostgreSQL typically doesn't have SSL enabled,
    // and forcing sslmode=require would silently kill the connection.
    if (!isPrivateHost(u.hostname)) {
      u.searchParams.set("sslmode", "require");
      u.searchParams.set("uselibpqcompat", "true");
    }

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
