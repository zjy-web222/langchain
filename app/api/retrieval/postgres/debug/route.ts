import { NextResponse } from "next/server";

import { USER2_TABLE } from "@/lib/db/constants";
import { getDatabaseUrl } from "@/lib/db/database-url";
import { fetchUser2Rows } from "@/lib/db/user2";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** 诊断 Prisma / user2 / documents 连接 */
export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
    const table = process.env.PRISMA_USER2_TABLE ?? USER2_TABLE;

    let user2Count: number | null = null;
    let user2Error: string | undefined;
    let documentsCount: number | null = null;
    let documentsError: string | undefined;

    if (hasDatabaseUrl) {
      try {
        const { rows } = await fetchUser2Rows();
        user2Count = rows.length;
      } catch (e: any) {
        user2Error = e.message;
      }

      try {
        const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*)::bigint AS count FROM documents`,
        );
        documentsCount = Number(result[0]?.count ?? 0);
      } catch (e: any) {
        documentsError = e.message;
      }
    }

    let databaseHost: string | undefined;
    try {
      databaseHost = hasDatabaseUrl
        ? new URL(getDatabaseUrl()).host
        : undefined;
    } catch {
      databaseHost = "invalid DATABASE_URL";
    }

    return NextResponse.json({
      ok: hasDatabaseUrl && user2Count !== null && user2Count > 0,
      database: "prisma",
      hasDatabaseUrl,
      databaseHost,
      usePoolerHint:
        databaseHost?.startsWith("db.") &&
        !databaseHost?.includes("pooler")
          ? "若连接失败，请改用 Dashboard 的 Transaction pooler (6543)"
          : undefined,
      user2Table: table,
      user2Count,
      user2Error,
      documentsCount,
      documentsError,
      hint: !hasDatabaseUrl
        ? "请配置 DATABASE_URL（Supabase → Settings → Database → Connection string）"
        : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
