import { OllamaEmbeddings } from "@langchain/ollama";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";

import { EMBEDDING_DIMENSIONS } from "./constants";

export function getOllamaEmbeddings() {
  return new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBEDDING_MODEL ?? "qwen3-embedding:4b",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  });
}

export async function assertEmbeddingDimensions(
  embeddings: EmbeddingsInterface,
  sampleText = "dimension check",
): Promise<void> {
  const vector = await embeddings.embedQuery(sampleText);
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding 维度为 ${vector.length}，与配置的 ${EMBEDDING_DIMENSIONS} 不一致。请检查 OLLAMA_EMBEDDING_DIMENSIONS 与数据库 halfvec 列。`,
    );
  }
}
