import "dotenv/config";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });

const prisma = new PrismaClient();
try {
  const r = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("Direct 5432 OK:", r);
} catch (e) {
  console.log("Direct 5432 FAIL:", e.message || e);
} finally {
  await prisma.$disconnect();
}
