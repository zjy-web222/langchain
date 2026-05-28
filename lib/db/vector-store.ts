import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";

import { prisma } from "@/lib/prisma";

import {
  EMBEDDING_DIMENSIONS,
  getUser2SourceMetadata,
  MATCH_DOCUMENTS_FN,
} from "./constants";
import { jsonSafeStringify } from "./json";

export type VectorSearchRow = {
  content: string;
  metadata: Record<string, unknown> | null;
  similarity?: number;
};

function toHalfvecLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/** 删除此前从 user2 同步的向量块 */
export async function clearUser2Vectors(): Promise<void> {
  const filterJson = jsonSafeStringify(getUser2SourceMetadata());
  await prisma.$executeRawUnsafe(
    `DELETE FROM documents WHERE metadata @> $1::jsonb`,
    filterJson,
  );
}

/** 批量写入向量（Prisma + raw SQL，支持 halfvec） */
export async function insertVectorDocuments(
  documents: Document[],
  embeddings: EmbeddingsInterface,
): Promise<void> {
  const texts = documents.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);
  const batchSize = 10;

  for (let i = 0; i < documents.length; i += batchSize) {
    const slice = documents.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (doc, j) => {
        const embedding = vectors[i + j];
        const vecStr = toHalfvecLiteral(embedding);
        const metadata = jsonSafeStringify(doc.metadata ?? {});

        await prisma.$executeRawUnsafe(
          `INSERT INTO documents (content, metadata, embedding)
           VALUES ($1, $2::jsonb, $3::halfvec(${EMBEDDING_DIMENSIONS}))`,
          doc.pageContent,
          metadata,
          vecStr,
        );
      }),
    );
  }
}

/** 调用 match_documents 做相似度检索 */
export async function searchSimilarDocuments(
  queryEmbedding: number[],
  k = 20,
  filter: Record<string, unknown> = getUser2SourceMetadata(),
): Promise<VectorSearchRow[]> {
  const vecStr = toHalfvecLiteral(queryEmbedding);
  const filterJson = jsonSafeStringify(filter);

  // Prisma 会把数字参数绑成 bigint，需显式 cast 为 int 以匹配 match_documents
  return prisma.$queryRawUnsafe<VectorSearchRow[]>(
    `SELECT content, metadata, similarity
     FROM ${MATCH_DOCUMENTS_FN}(
       $1::halfvec(${EMBEDDING_DIMENSIONS}),
       $2::int,
       $3::jsonb
     )`,
    vecStr,
    k,
    filterJson,
  );
}
