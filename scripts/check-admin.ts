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

async function main() {
  const pool = new Pool({
    connectionString: normalizeConnectionString(process.env.DATABASE_URL ?? ""),
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  const user = await db.user.findUnique({
    where: { email: "admin@envichips.com" },
  });

  if (!user) {
    console.log("❌ Usuario NO encontrado");
    process.exit(1);
  }

  console.log("✅ Usuario encontrado");
  console.log("   Email:", user.email);
  console.log("   Rol:", user.rol);
  console.log("   Activo:", user.activo);
  console.log("   Hash empieza con:", user.password.substring(0, 7));
  console.log("   Hash largo:", user.password.length, "chars");

  const ok = await bcrypt.compare("admin123", user.password);
  console.log("   bcrypt.compare('admin123'):", ok ? "✅ OK" : "❌ FALLA");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
