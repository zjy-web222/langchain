import fs from "fs";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import {
  assertEmbeddingDimensions,
  getOllamaEmbeddings,
} from "@/lib/db/embeddings";
import {
  getLocalRagSourcePath,
  LOCAL_RAG_SOURCE_FILE,
} from "@/lib/rag/local-readme";

export const runtime = "nodejs";

/**
 * 读取项目根目录的 README.md（或 LOCAL_RAG_SOURCE_FILE），切块并向量化，
 * 写入本地 vectorstore/documents.json。
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
    const filePath = getLocalRagSourcePath();

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `文件不存在：${LOCAL_RAG_SOURCE_FILE}` },
        { status: 404 },
      );
    }

    const content = fs.readFileSync(filePath, "utf8");
    const documents = [
      new Document({
        pageContent: content,
        metadata: { source: filePath },
      }),
    ];

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
    });

    const splitDocuments = await splitter.splitDocuments(documents);

    const embeddings = getOllamaEmbeddings();
    await assertEmbeddingDimensions(embeddings);

    await MemoryVectorStore.fromDocuments(splitDocuments, embeddings);

    const vectorstorePath = path.join(process.cwd(), "vectorstore");
    if (!fs.existsSync(vectorstorePath)) {
      fs.mkdirSync(vectorstorePath, { recursive: true });
    }

    const documentsWithEmbeddings = await Promise.all(
      splitDocuments.map(async (doc) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          metadata: {
            ...doc.metadata,
            source: LOCAL_RAG_SOURCE_FILE,
          },
          embedding,
        };
      }),
    );

    fs.writeFileSync(
      path.join(vectorstorePath, "documents.json"),
      JSON.stringify(documentsWithEmbeddings),
    );

    return NextResponse.json(
      {
        ok: true,
        message: `${LOCAL_RAG_SOURCE_FILE} 已向量化（${splitDocuments.length} 个片段）`,
        chunks: splitDocuments.length,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "入库失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
