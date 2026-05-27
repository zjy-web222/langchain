// 导入Next.js服务器端请求和响应处理模块
import { NextRequest, NextResponse } from "next/server";
// 导入文本分割器，用于将长文本分割成小块
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// 导入内存向量存储实现
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
// 导入Ollama嵌入模型
import { OllamaEmbeddings } from "@langchain/ollama";
// 导入docx文件加载器
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

// 设置运行时为nodejs，以便使用文件系统操作
export const runtime = "nodejs";

// 运行前，请按照以下说明设置：
// https://js.langchain.com/v0.2/docs/integrations/vectorstores/supabase

/**
 * 此处理函数读取本地的"检索模型.docx"文件，将其分割成小块，
 * 然后将这些小块嵌入到向量存储中，以便以后检索。
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
    // 导入fs和path模块用于文件操作
    const fs = require('fs');
    const path = require('path');

    // 定义本地docx文件路径
    const filePath = path.join(process.cwd(), '检索模型.docx');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "文件不存在：检索模型.docx" }, { status: 404 });
    }

    // 使用DocxLoader加载docx文件
    const loader = new DocxLoader(filePath);
    const documents = await loader.load();

    // 创建文本分割器，用于将文本分割成小块
    const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // 增加每个块的大小，避免过度分割
  chunkOverlap: 200, // 增加重叠部分，确保上下文连贯性
  separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""], // 优化分隔符
});

    // 将文档分割成小块
    const splitDocuments = await splitter.splitDocuments(documents);

    // 创建Ollama嵌入模型
    const embeddings = new OllamaEmbeddings({
      model: "qwen3-embedding:0.6b",
      baseUrl: "http://localhost:11434",
    });

    // 将文档块嵌入到内存向量存储中
    const vectorstore = await MemoryVectorStore.fromDocuments(
      splitDocuments, // 分割后的文档
      embeddings
    );

    // 保存向量存储到本地文件
    const vectorstorePath = path.join(process.cwd(), 'vectorstore');
    if (!fs.existsSync(vectorstorePath)) {
      fs.mkdirSync(vectorstorePath, { recursive: true });
    }
    
    // 保存文档和嵌入
    const documentsWithEmbeddings = await Promise.all(
      splitDocuments.map(async (doc) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          metadata: doc.metadata,
          embedding
        };
      })
    );
    
    fs.writeFileSync(
      path.join(vectorstorePath, 'documents.json'),
      JSON.stringify(documentsWithEmbeddings)
    );

    // 返回成功响应
    return NextResponse.json({ ok: true, message: "文件处理成功" }, { status: 200 });
  } catch (e: any) {
    // 返回错误响应
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
