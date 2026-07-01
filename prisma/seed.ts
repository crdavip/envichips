import "dotenv/config";

async function main() {
  const mode = process.env.SEED_MODE || process.env.NODE_ENV || "development";

  if (mode === "production") {
    console.log("🌱 Running PRODUCTION seed...");
    const { main: prodMain } = await import("./seed.production");
    await prodMain();
  } else {
    console.log("🌱 Running DEVELOPMENT seed...");
    const { main: devMain } = await import("./seed.dev");
    await devMain();
  }
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
}).finally(() => process.exit(0));
