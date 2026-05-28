import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import {
  assertEmbeddingDimensions,
  getOllamaEmbeddings,
} from "@/lib/db/embeddings";
import { fetchLocalSourceRows } from "@/lib/local-pg/source-fetch";
import {
  clearLocalVectors,
  insertLocalVectorDocuments,
} from "@/lib/local-pg/vector-store";
import { getLocalSourceMetadata } from "@/lib/local-pg/constants";
import { tableRowsToDocuments } from "@/lib/rag/table-rows";

export const runtime = "nodejs";

/**
 * 本地 Postgres：从业务表读取 → 向量化 → 写入 documents 向量表。
 */
export async function POST(_req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return NextResponse.json(
      { error: "演示模式不支持数据导入。" },
      { status: 403 },
    );
  }

  try {
    const { rows, table } = await fetchLocalSourceRows();
    const sourceMeta = getLocalSourceMetadata();

    const documents = tableRowsToDocuments(rows, {
      sourceMetadata: sourceMeta,
      tableName: table,
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
    });
    const splitDocuments = await splitter.splitDocuments(documents);

    const embeddings = getOllamaEmbeddings();
    await assertEmbeddingDimensions(embeddings);

    await clearLocalVectors();
    await insertLocalVectorDocuments(splitDocuments, embeddings);

    return NextResponse.json(
      {
        ok: true,
        message: `已从本地表 ${table} 同步 ${rows.length} 条记录，生成 ${splitDocuments.length} 个向量块`,
        rowCount: rows.length,
        chunkCount: splitDocuments.length,
        table,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("Local PG ingest error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
