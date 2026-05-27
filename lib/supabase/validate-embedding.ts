import type { EmbeddingsInterface } from "@langchain/core/embeddings";

import { EMBEDDING_DIMENSIONS } from "./constants";

/** 入库前校验 Ollama 输出维度是否与 Supabase halfvec(2560) 一致 */
export async function assertEmbeddingDimensions(
  embeddings: EmbeddingsInterface,
  sampleText = "dimension check",
): Promise<void> {
  const vector = await embeddings.embedQuery(sampleText);
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      [
        `Embedding 维度为 ${vector.length}，与配置的 ${EMBEDDING_DIMENSIONS} 不一致。`,
        `请同步修改：OLLAMA_EMBEDDING_DIMENSIONS、Supabase documents.embedding 列、match_documents 函数。`,
        `当前 Supabase 迁移脚本使用 halfvec(${EMBEDDING_DIMENSIONS})。`,
      ].join(" "),
    );
  }
}
