/** 与 Ollama embedding 模型输出维度一致，需与 Supabase documents.embedding 列一致 */
export const EMBEDDING_DIMENSIONS = Number(
  process.env.OLLAMA_EMBEDDING_DIMENSIONS ?? "2560",
);
