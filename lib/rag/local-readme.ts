import path from "path";

/** 本地 Markdown RAG 默认数据源（项目根目录） */
export const LOCAL_RAG_SOURCE_FILE =
  process.env.LOCAL_RAG_SOURCE_FILE ?? "README.md";

export function getLocalRagSourcePath(cwd = process.cwd()) {
  return path.join(cwd, LOCAL_RAG_SOURCE_FILE);
}

export function getLocalVectorstorePath(cwd = process.cwd()) {
  return path.join(cwd, "vectorstore", "documents.json");
}
