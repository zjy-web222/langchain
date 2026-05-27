import { NextResponse } from "next/server";

import {
  detectSupabaseKeyKind,
  resolveSupabaseKey,
} from "@/lib/supabase/config";
import { getSupabaseClient, USER2_TABLE } from "@/lib/supabase/client";

export const runtime = "nodejs";

/** 诊断 Supabase / user2 连接（开发调试用） */
export async function GET() {
  try {
    const url = process.env.SUPABASE_URL;
    const key = resolveSupabaseKey();
    const keyKind = key ? detectSupabaseKeyKind(key) : null;
    const table = process.env.SUPABASE_USER2_TABLE ?? USER2_TABLE;

    if (!url || !key) {
      return NextResponse.json({
        ok: false,
        error: "缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    let clientError: string | undefined;
    let rowCount: number | null = null;
    let fetchError: string | undefined;

    try {
      const client = getSupabaseClient();
      const { data, error, count } = await client
        .from(table)
        .select("*", { count: "exact" });

      if (error) {
        fetchError = `${error.message} (${error.code})`;
      } else {
        rowCount = count ?? data?.length ?? 0;
      }
    } catch (e: any) {
      clientError = e.message;
    }

    return NextResponse.json({
      ok: !clientError && rowCount !== null && rowCount > 0,
      supabaseUrl: url,
      keyKind,
      keyHint:
        keyKind === "publishable" || keyKind === "anon"
          ? "请改用 service_role key，否则 RLS 可能导致查不到 user2 数据"
          : undefined,
      table,
      rowCount,
      fetchError,
      clientError,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
