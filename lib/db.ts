import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function normalizeConnectionString(url: string): string {
  // Use require (not verify-full) for broader SSL compatibility.
  // verify-full requires system CA certificates that may not be present
  // in serverless environments like Vercel.
  if (url.includes("sslmode=")) {
    return url.replace(/sslmode=\w+/g, "sslmode=require");
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}sslmode=require`;
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
