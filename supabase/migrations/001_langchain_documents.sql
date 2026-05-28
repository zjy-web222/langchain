-- Supabase SQL Editor 执行一次（2560 维 + halfvec，适配 qwen3-embedding:4b）

create extension if not exists vector;

drop index if exists documents_embedding_idx;

create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding halfvec(2560)
);

create index if not exists documents_embedding_idx
  on documents
  using hnsw (embedding halfvec_cosine_ops);

create or replace function match_documents (
  query_embedding halfvec(2560),
  match_count int default null,
  filter jsonb default '{}'
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
