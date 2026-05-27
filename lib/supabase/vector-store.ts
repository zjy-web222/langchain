import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OllamaEmbeddings } from "@langchain/ollama";
import type { SupabaseMetadata } from "@langchain/community/vectorstores/supabase";

import {
  EMBEDDING_DIMENSIONS,
  getSupabaseClient,
  MATCH_DOCUMENTS_FN,
  USER2_SOURCE_METADATA,
  VECTOR_TABLE,
} from "./client";

export { EMBEDDING_DIMENSIONS };

export { USER2_SOURCE_METADATA };

export function getOllamaEmbeddings() {
  return new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBEDDING_MODEL ?? "qwen3-embedding:4b",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  });
}

type VectorStoreOptions = {
  filter?: SupabaseMetadata;
};

export async function getSupabaseVectorStore(options?: VectorStoreOptions) {
  const embeddings = getOllamaEmbeddings();
  const client = getSupabaseClient();

  return SupabaseVectorStore.fromExistingIndex(embeddings, {
    client,
    tableName: VECTOR_TABLE,
    queryName: MATCH_DOCUMENTS_FN,
    filter: options?.filter,
  });
}

export async function getUser2VectorStore() {
  return getSupabaseVectorStore({ filter: USER2_SOURCE_METADATA });
}

/** 重新入库前删除此前从 user2 同步的向量 */
export async function clearUser2Vectors() {
  const client = getSupabaseClient();
  const { error } = await client
    .from(VECTOR_TABLE)
    .delete()
    .contains("metadata", USER2_SOURCE_METADATA);

  if (error) {
    throw new Error(`清除旧向量失败: ${error.message}`);
  }
}
