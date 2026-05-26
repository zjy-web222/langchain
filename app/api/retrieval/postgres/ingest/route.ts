// 导入Next.js服务器端请求和响应处理模块
import { NextRequest, NextResponse } from "next/server";
// 导入文本分割器，用于将长文本分割成小块
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// 导入Ollama嵌入模型
import { OllamaEmbeddings } from "@langchain/ollama";
// 导入文档类型
import { Document } from "@langchain/core/documents";

// 导入Prisma客户端
import { PrismaClient } from "@prisma/client";

// 创建Prisma客户端实例
const prisma = new PrismaClient();

// 设置运行时为nodejs，以便使用文件系统操作
export const runtime = "nodejs";

/**
 * 此处理函数从PostgreSQL数据库读取数据，将其分割成小块，
 * 然后将这些小块嵌入到PostgreSQL向量存储中，以便以后检索。
 */
export async function POST(req: NextRequest) {
  // 如果是演示模式，返回错误信息
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
    // 从请求体获取数据库表名和查询
    const body = await req.json();
    const tableName = body.tableName;
    const query = body.query || `SELECT * FROM ${tableName}`;

    if (!tableName) {
      return NextResponse.json({ error: "缺少tableName参数" }, { status: 400 });
    }

    // 从PostgreSQL数据库查询数据
    const results = (await prisma.$queryRawUnsafe(query)) as Record<string, unknown>[];

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "查询结果为空" }, { status: 404 });
    }

    // 将查询结果转换为文档
    const documents = results.map((result: any, index: number) => {
      // 将对象转换为字符串
      const content = JSON.stringify(result, null, 2);
      return new Document({
        pageContent: content,
        metadata: {
          id: index,
          tableName,
          ...result
        }
      });
    });

    // 创建文本分割器，用于将文本分割成小块
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // 每个块的大小
      chunkOverlap: 200, // 重叠部分
      separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""], // 分隔符
    });

    // 将文档分割成小块
    const splitDocuments = await splitter.splitDocuments(documents);

    // 创建Ollama嵌入模型
    const embeddings = new OllamaEmbeddings({
      model: "qwen3-embedding:4b",
      baseUrl: "http://localhost:11434",
    });

    // 批量处理文档
    const batchSize = 10;
    for (let i = 0; i < splitDocuments.length; i += batchSize) {
      const batch = splitDocuments.slice(i, i + batchSize);
      
      // 并行处理批次中的文档
      await Promise.all(
        batch.map(async (doc) => {
          // 生成嵌入
          const embedding = await embeddings.embedQuery(doc.pageContent);
          
          // 存储到PostgreSQL
          await prisma.$executeRaw`
            INSERT INTO documents (content, metadata, embedding)
            VALUES (${doc.pageContent}, ${doc.metadata as any}, ${embedding}::vector)
          `;
        })
      );
    }

    // 返回成功响应
    return NextResponse.json({ 
      ok: true, 
      message: "数据处理成功",
      processedCount: splitDocuments.length
    }, { status: 200 });
  } catch (e: any) {
    // 记录错误
    console.error("错误:", e);
    // 返回错误响应
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    // 关闭Prisma客户端
    await prisma.$disconnect();
  }
}
