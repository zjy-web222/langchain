/**
 * 本地 Postgres 向量库读写（独立连接 LOCAL_DATABASE_URL）
 * 供 /api/retrieval/local 使用
 */
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";

import { EMBEDDING_DIMENSIONS } from "@/lib/db/constants";
import { jsonSafeStringify } from "@/lib/db/json";

import {
  getLocalEmbeddingColumnType,
  getLocalSourceMetadata,
  LOCAL_MATCH_FN,
  LOCAL_VECTOR_TABLE,
} from "./constants";
import { localPrisma } from "./prisma";

export type LocalVectorSearchRow = {
  content: string;
  metadata: Record<string, unknown> | null;
  similarity?: number;
};

function embeddingTypeSql(): string {
  const kind = getLocalEmbeddingColumnType();
  return `${kind}(${EMBEDDING_DIMENSIONS})`;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function clearLocalVectors(): Promise<void> {
  const filterJson = jsonSafeStringify(getLocalSourceMetadata());
  await localPrisma.$executeRawUnsafe(
    `DELETE FROM "${LOCAL_VECTOR_TABLE}" WHERE metadata @> $1::jsonb`,
    filterJson,
  );
}

export async function insertLocalVectorDocuments(
  documents: Document[],
  embeddings: EmbeddingsInterface,
): Promise<void> {
  const typeSql = embeddingTypeSql();
  const texts = documents.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);
  const batchSize = 10;

  for (let i = 0; i < documents.length; i += batchSize) {
    const slice = documents.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (doc, j) => {
        const embedding = vectors[i + j];
        const vecStr = toVectorLiteral(embedding);
        const metadata = jsonSafeStringify(doc.metadata ?? {});

        await localPrisma.$executeRawUnsafe(
          `INSERT INTO "${LOCAL_VECTOR_TABLE}" (content, metadata, embedding)
           VALUES ($1, $2::jsonb, $3::${typeSql})`,
          doc.pageContent,
          metadata,
          vecStr,
        );
      }),
    );
  }
}

export async function searchLocalSimilarDocuments(
  queryEmbedding: number[],
  k = 20,
): Promise<LocalVectorSearchRow[]> {
  const typeSql = embeddingTypeSql();
  const vecStr = toVectorLiteral(queryEmbedding);
  const filterJson = jsonSafeStringify(getLocalSourceMetadata());

  return localPrisma.$queryRawUnsafe<LocalVectorSearchRow[]>(
    `SELECT content, metadata, similarity
     FROM ${LOCAL_MATCH_FN}(
       $1::${typeSql},
       $2::int,
       $3::jsonb
     )`,
    vecStr,
    k,
    filterJson,
  );
}
