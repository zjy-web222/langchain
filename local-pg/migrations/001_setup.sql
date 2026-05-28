-- 本地 PostgreSQL 执行（需 pgvector；2560 维用 halfvec，避免 HNSW 2000 维上限）
-- 用法：psql -U postgres -d langchain_local -f local-pg/migrations/001_setup.sql
-- .env.local：LOCAL_PG_EMBEDDING_COLUMN_TYPE=halfvec（代码默认已是 halfvec）

CREATE EXTENSION IF NOT EXISTS vector;

-- 示例业务表（表名可通过 LOCAL_PG_SOURCE_TABLE 修改）
CREATE TABLE IF NOT EXISTS local_source (
  id bigserial PRIMARY KEY,
  title text,
  body text,
  created_at timestamptz DEFAULT now()
);

-- 若曾用 vector(2560) 建过表，先清理再重建
DROP INDEX IF EXISTS documents_embedding_idx;
DROP TABLE IF EXISTS documents CASCADE;
DROP FUNCTION IF EXISTS match_documents(vector, int, jsonb);
DROP FUNCTION IF EXISTS match_documents(halfvec, int, jsonb);

CREATE TABLE documents (
  id bigserial PRIMARY KEY,
  content text,
  metadata jsonb,
  embedding halfvec(2560)
);

CREATE INDEX documents_embedding_idx
  ON documents
  USING hnsw (embedding halfvec_cosine_ops);

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding halfvec(2560),
  match_count int DEFAULT NULL,
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
