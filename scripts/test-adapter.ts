import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 30) + "...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const user = await db.user.findUnique({ where: { email: "admin@envichips.com" } });
  console.log("User:", user?.email, user?.rol);
  await db.$disconnect();
}

main().catch((e) => console.error("Error:", e.message, e.stack));
