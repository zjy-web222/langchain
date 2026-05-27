import type { SupabaseClient } from "@supabase/supabase-js";

import { USER2_TABLE } from "./client";

export type User2FetchResult = {
  rows: Record<string, unknown>[];
  count: number | null;
};

/**
 * 从 Supabase 读取 user2 表；若为空会附带更明确的诊断信息。
 */
export async function fetchUser2Rows(
  client: SupabaseClient,
): Promise<User2FetchResult> {
  const table = process.env.SUPABASE_USER2_TABLE ?? USER2_TABLE;

  const { data, error, count } = await client
    .from(table)
    .select("*", { count: "exact" });

  if (error) {
    throw new Error(
      `读取表 "${table}" 失败: ${error.message}（code: ${error.code ?? "unknown"}）`,
    );
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  if (rows.length === 0) {
    const hint =
      count === 0
        ? `表 "${table}" 对当前 API 密钥可见行数为 0。若 Supabase 控制台里能看到数据，多半是密钥权限或 RLS 策略导致。`
        : `表 "${table}" 未返回数据（count=${count ?? "null"}）。`;
    throw new Error(hint);
  }

  return { rows, count };
}
