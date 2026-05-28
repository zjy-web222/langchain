import { prisma } from "@/lib/prisma";

import { USER2_TABLE } from "./constants";
import { getDatabaseConnectionHint } from "./database-url";

function resolveUser2TableName(): string {
  const table = process.env.PRISMA_USER2_TABLE ?? USER2_TABLE;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`非法表名: ${table}`);
  }
  return table;
}

export type User2FetchResult = {
  rows: Record<string, unknown>[];
};

/** 通过 Prisma 读取 user2 业务表（Postgres 直连，绕过 Supabase REST / RLS） */
export async function fetchUser2Rows(): Promise<User2FetchResult> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "缺少 DATABASE_URL。请在 .env.local 配置 Supabase 的 Postgres 连接串（Settings → Database → Connection string）。",
    );
  }

  const table = resolveUser2TableName();
  let rows: Record<string, unknown>[];
  try {
    rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "${table}"`,
    );
  } catch (e) {
    const hint = getDatabaseConnectionHint(e);
    throw new Error(hint ?? (e instanceof Error ? e.message : String(e)));
  }

  if (!rows.length) {
    throw new Error(`表 "${table}" 中没有数据，请先在 Supabase 中确认 user2 有记录。`);
  }

  return { rows };
}
