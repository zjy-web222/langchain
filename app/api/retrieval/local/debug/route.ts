import { NextResponse } from "next/server";

import {
  LOCAL_SOURCE_TABLE,
  LOCAL_VECTOR_TABLE,
} from "@/lib/local-pg/constants";
import { getLocalDatabaseUrl } from "@/lib/local-pg/database-url";
import { fetchLocalSourceRows } from "@/lib/local-pg/source-fetch";
import { localPrisma } from "@/lib/local-pg/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const hasUrl = Boolean(process.env.LOCAL_DATABASE_URL);
    const sourceTable = process.env.LOCAL_PG_SOURCE_TABLE ?? LOCAL_SOURCE_TABLE;

    let sourceCount: number | null = null;
    let sourceError: string | undefined;
    let vectorCount: number | null = null;
    let vectorError: string | undefined;

    if (hasUrl) {
      try {
        const { rows } = await fetchLocalSourceRows();
        sourceCount = rows.length;
      } catch (e: any) {
        sourceError = e.message;
      }

      try {
        const result = await localPrisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*)::bigint AS count FROM "${LOCAL_VECTOR_TABLE}"`,
        );
        vectorCount = Number(result[0]?.count ?? 0);
      } catch (e: any) {
        vectorError = e.message;
      }
    }

    return NextResponse.json({
      ok: hasUrl && sourceCount !== null && sourceCount > 0,
      database: "local-postgres",
      hasLocalDatabaseUrl: hasUrl,
      databaseHost: hasUrl ? new URL(getLocalDatabaseUrl()).host : undefined,
      sourceTable,
      sourceCount,
      sourceError,
      vectorTable: LOCAL_VECTOR_TABLE,
      vectorCount,
      vectorError,
      hint: !hasUrl
        ? "请配置 LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/dbname"
        : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
