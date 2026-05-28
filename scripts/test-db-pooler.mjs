import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.log("No DATABASE_URL");
  process.exit(1);
}

const u = new URL(raw);
const password = u.password;
const projectRef = "klbwkpghpfqlrtkzytok";
const encPass = encodeURIComponent(password);

const candidates = [
  ["direct 5432 (current)", raw],
  [
    "pooler 6543 transaction",
    `postgresql://postgres.${projectRef}:${encPass}@${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  ],
  [
    "pooler 5432 session",
    `postgresql://postgres.${projectRef}:${encPass}@${projectRef}.pooler.supabase.com:5432/postgres`,
  ],
];

for (const [label, url] of candidates) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("SUCCESS:", label, new URL(url).host, r);
    console.log("\nUse this DATABASE_URL in .env.local:\n" + url);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.log("FAIL:", label, "-", e.message?.split("\n")[2] || e.message?.split("\n")[0]);
    await prisma.$disconnect();
  }
}

console.log(
  "\n请在 Supabase → Project Settings → Database → Connection string",
);
console.log("选择 URI，复制 Transaction pooler（端口 6543）到 DATABASE_URL");
