import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });

const raw = process.env.DATABASE_URL;
const u = new URL(raw);
const encPass = encodeURIComponent(u.password);
const base = `postgresql://${u.username}:${encPass}@${u.hostname}:${u.port || 5432}${u.pathname}`;

const variants = [
  ["no params", raw],
  ["sslmode=require", `${base}?sslmode=require`],
  [
    "sslmode=require connect_timeout=30",
    `${base}?sslmode=require&connect_timeout=30`,
  ],
];

for (const [label, url] of variants) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("SUCCESS:", label);
    console.log(url.replace(encPass, "***"));
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    const msg = e.message?.includes("Can't reach")
      ? "Can't reach"
      : e.message?.split("\n").find((l) => l.includes("Authentication")) ||
        e.message?.split("\n").slice(-3).join(" ");
    console.log("FAIL:", label, "-", msg);
    await prisma.$disconnect();
  }
}
