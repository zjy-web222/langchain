export const USER2_TABLE = "user2";

export function getUser2SourceMetadata() {
  const table = process.env.PRISMA_USER2_TABLE ?? USER2_TABLE;
  return { source_table: table };
}

export const USER2_SOURCE_METADATA = { source_table: USER2_TABLE };

/** 与 Ollama embedding、Postgres halfvec(2560) 一致 */
export const EMBEDDING_DIMENSIONS = Number(
  process.env.OLLAMA_EMBEDDING_DIMENSIONS ?? "2560",
);

export const MATCH_DOCUMENTS_FN =
  process.env.SUPABASE_MATCH_FN ?? "match_documents";
