import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { USER2_TABLE } from "@/lib/db/constants";
import {
  assertEmbeddingDimensions,
  getOllamaEmbeddings,
} from "@/lib/db/embeddings";
import { fetchUser2Rows } from "@/lib/db/user2";
import {
  clearUser2Vectors,
  insertVectorDocuments,
} from "@/lib/db/vector-store";
import { user2RowsToDocuments } from "@/lib/rag/user2";

export const runtime = "nodejs";

/**
 * Prisma 直连 Postgres：从 user2 读取 → 向量化 → 写入 documents（halfvec）。
 */
export async function POST(_req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return NextResponse.json(
      {
        error: [
          "演示模式不支持数据导入。",
          "请在此处设置您自己的仓库版本：https://github.com/langchain-ai/langchain-nextjs-template",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    const { rows } = await fetchUser2Rows();

    const documents = user2RowsToDocuments(rows);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
    });
    const splitDocuments = await splitter.splitDocuments(documents);

    const embeddings = getOllamaEmbeddings();
    await assertEmbeddingDimensions(embeddings);

    await clearUser2Vectors();
    await insertVectorDocuments(splitDocuments, embeddings);

    return NextResponse.json(
      {
        ok: true,
        message: `已从 ${USER2_TABLE} 同步 ${rows.length} 条记录，生成 ${splitDocuments.length} 个向量块（Prisma）`,
        rowCount: rows.length,
        chunkCount: splitDocuments.length,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("Prisma ingest error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
