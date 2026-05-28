export const LOCAL_SOURCE_TABLE =
  process.env.LOCAL_PG_SOURCE_TABLE ?? "local_source";

export const LOCAL_VECTOR_TABLE =
  process.env.LOCAL_PG_VECTOR_TABLE ?? "documents";

export const LOCAL_MATCH_FN =
  process.env.LOCAL_PG_MATCH_FN ?? "match_documents";

/** local_pg | 与 Supabase 模块的 user2 向量区分 */
export const LOCAL_SOURCE_TAG = "local_pg";

export function getLocalSourceMetadata() {
  return {
    source_table: LOCAL_SOURCE_TAG,
    source_name: process.env.LOCAL_PG_SOURCE_TABLE ?? LOCAL_SOURCE_TABLE,
  };
}

export function getLocalEmbeddingColumnType(): string {
  return process.env.LOCAL_PG_EMBEDDING_COLUMN_TYPE ?? "halfvec";
}
