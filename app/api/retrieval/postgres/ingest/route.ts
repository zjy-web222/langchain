import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { getSupabaseClient, USER2_TABLE } from "@/lib/supabase/client";
import { fetchUser2Rows } from "@/lib/supabase/user2-fetch";
import {
  clearUser2Vectors,
  getOllamaEmbeddings,
  getSupabaseVectorStore,
} from "@/lib/supabase/vector-store";
import { assertEmbeddingDimensions } from "@/lib/supabase/validate-embedding";
import { user2RowsToDocuments } from "@/lib/rag/user2";

export const runtime = "nodejs";

/**
 * 从 Supabase 的 user2 表读取数据，切块并向量化后写入 Supabase 向量表（documents）。
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
    const supabase = getSupabaseClient();
    const { rows } = await fetchUser2Rows(supabase);

    const documents = user2RowsToDocuments(rows);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
    });
    const splitDocuments = await splitter.splitDocuments(documents);

    await clearUser2Vectors();

    const embeddings = getOllamaEmbeddings();
    await assertEmbeddingDimensions(embeddings);

    const vectorStore = await getSupabaseVectorStore();
    await vectorStore.addDocuments(splitDocuments);

    return NextResponse.json(
      {
        ok: true,
        message: `已从 ${USER2_TABLE} 同步 ${rows.length} 条记录，生成 ${splitDocuments.length} 个向量块`,
        rowCount: rows.length,
        chunkCount: splitDocuments.length,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("Supabase ingest error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
