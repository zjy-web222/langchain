/** Supabase / 云端 Postgres 的 Prisma 单例（DATABASE_URL） */
import { PrismaClient } from "@prisma/client";

import { getDatabaseUrl } from "@/lib/db/database-url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
