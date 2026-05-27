import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { assertServerSupabaseKey, resolveSupabaseKey } from "./config";

export { EMBEDDING_DIMENSIONS } from "./constants";

export const USER2_TABLE = "user2";
export const USER2_SOURCE_METADATA = { source_table: USER2_TABLE };
export const VECTOR_TABLE =
  process.env.SUPABASE_VECTOR_TABLE ?? "documents";
export const MATCH_DOCUMENTS_FN =
  process.env.SUPABASE_MATCH_FN ?? "match_documents";

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = resolveSupabaseKey();

  if (!url || !key) {
    throw new Error(
      "缺少 Supabase 配置：请设置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY（推荐 service_role，也可用 SUPABASE_PRIVATE_KEY）",
    );
  }

  assertServerSupabaseKey(key);

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
