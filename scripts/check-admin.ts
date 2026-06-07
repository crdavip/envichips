import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
