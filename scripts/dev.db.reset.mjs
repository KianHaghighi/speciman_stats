#!/usr/bin/env node

import { execSync } from "node:child_process";

const env = process.env.NODE_ENV || "development";
const ci = process.env.CI === "true";

if (env === "production" || ci) {
  console.error("❌ Refusing to reset DB in production/CI.");
  console.error(`   NODE_ENV: ${env}`);
  console.error(`   CI: ${ci}`);
  process.exit(1);
}

console.log("[INFO] 🔄 Resetting local dev database...");
console.log(`[INFO] Environment: ${env}`);

try {
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
  console.log("[INFO] 🌱 Seeding...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  console.log("[INFO] ✅ Done.");
} catch (error) {
  console.error("[ERROR] Failed to reset database:", error.message);
  process.exit(1);
}
