import { PrismaClient } from "@prisma/client";

import { getLocalDatabaseUrl } from "./database-url";

const globalForLocalPrisma = globalThis as unknown as {
  localPrisma: PrismaClient | undefined;
};

export const localPrisma =
  globalForLocalPrisma.localPrisma ??
  new PrismaClient({
    datasources: {
      db: { url: getLocalDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForLocalPrisma.localPrisma = localPrisma;
}
