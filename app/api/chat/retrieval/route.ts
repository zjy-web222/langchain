import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOllama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";

export const runtime = "nodejs";

const combineDocumentsFn = (docs: Document[]) => {
  const serializedDocs = docs.map((doc) => doc.pageContent);
  return serializedDocs.join("\n\n");
};

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
  const formattedDialogueTurns = chatHistory.map((message) => {
    if (message.role === "user") {
      return `Human: ${message.content}`;
    } else if (message.role === "assistant") {
      return `Assistant: ${message.content}`;
    } else {
      return `${message.role}: ${message.content}`;
    }
  });
  return formattedDialogueTurns.join("\n");
};

const CONDENSE_QUESTION_TEMPLATE = `根据以下对话和后续问题，将后续问题重新表述为一个独立问题，必须使用中文回答。

<chat_history>
  {chat_history}
</chat_history>

后续输入：{question}
独立问题（请用中文）：`;
const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);

const ANSWER_TEMPLATE = `你是一个专业的AI助手，必须严格基于提供的文档内容回答用户问题。

【强制要求】
- 所有回答必须使用中文，包括思考过程和最终回复
- 禁止使用英文回答
- 如果文档中有英文内容，请将其翻译成中文后再回答

请按照以下格式回答：
1. 首先在【思考过程】标签中展示你的思考过程（使用中文）
2. 然后在【最终回复】标签中给出你的最终回复（使用中文）

【思考过程格式要求】
请按照以下步骤进行思考：
1. 分析用户问题：明确用户的具体问题和需求
2. 检索文档内容：从提供的文档上下文中查找相关信息
3. 提取关键信息：识别文档中与问题相关的核心内容
4. 整合分析：将提取的信息与问题进行关联分析
5. 形成结论：基于文档内容得出最终答案

基于以下文档上下文和聊天历史回答问题：
<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

问题：{question}

重要要求：
- 你的回答必须严格基于提供的文档上下文信息
- 从文档上下文中提取相关信息来回答问题
- 不要重复用户的问题，要直接回答
- 如果文档上下文中包含相关信息，必须使用这些信息
- 如果文档上下文中没有相关信息，明确说明"根据提供的文档，我没有找到相关信息"
- 回答要准确、简洁、有条理
- 对于文档中的具体数据、事实或信息，要准确引用
- 不要使用文档之外的知识，只能基于提供的文档内容回答
- 所有内容必须使用中文，禁止出现英文
`;
const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

/**
 * This handler initializes and calls a retrieval chain. It composes the chain using
 * LangChain Expression Language. See the docs for more information:
 *
 * https://js.langchain.com/v0.2/docs/how_to/qa_chat_history_how_to/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    const model = new ChatOllama({
      model: "qwen3:4b",
      temperature: 0.1, // 降低温度，提高回答的准确性和一致性
      baseUrl: "http://localhost:11434",
    });

    // 导入fs模块用于文件操作
    const fs = require('fs');
    const path = require('path');

    // 创建Ollama嵌入模型
    const embeddings = new OllamaEmbeddings({
      model: "qwen3-embedding:0.6b",
      baseUrl: "http://localhost:11434",
    });

    // 从本地文件加载向量存储
    const vectorstorePath = path.join(process.cwd(), 'vectorstore');
    const documentsPath = path.join(vectorstorePath, 'documents.json');
    
    let vectorstore;
    if (fs.existsSync(documentsPath)) {
      // 读取文档和嵌入
      const documentsWithEmbeddings = JSON.parse(fs.readFileSync(documentsPath, 'utf8'));
      
      // 创建文档对象
      const documents = documentsWithEmbeddings.map((item: any) => {
        return new Document({
          pageContent: item.content,
          metadata: item.metadata
        });
      });
      
      // 创建内存向量存储
      vectorstore = await MemoryVectorStore.fromDocuments(
        documents,
        embeddings
      );
    } else {
      // 如果没有文档，创建空的向量存储
      vectorstore = new MemoryVectorStore(embeddings);
    }
    /**
     * We use LangChain Expression Language to compose two chains.
     * To learn more, see the guide here:
     *
     * https://js.langchain.com/docs/guides/expression_language/cookbook
     *
     * You can also use the "createRetrievalChain" method with a
     * "historyAwareRetriever" to get something prebaked.
     */
    // 创建独立问题链：将用户的问题与聊天历史结合，生成一个独立的问题
    // 这样可以确保检索的准确性，不受聊天历史中无关内容的影响
    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt, // 使用压缩问题模板
      model, // 调用模型生成独立问题
      new StringOutputParser(), // 将模型输出解析为字符串
    ]);

    // 创建一个Promise，用于捕获检索到的文档
    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    // 创建检索器，用于从向量存储中检索相关文档
    const retriever = vectorstore.asRetriever({
      k: 20, // 增加检索文档数量，确保能够检索到整个文档的相关内容
      callbacks: [
        {
          // 当检索完成时，将检索到的文档传递给Promise
          handleRetrieverEnd(documents) {
            resolveWithDocuments(documents);
          },
        },
      ],
    });

    // 创建检索链：将检索器的结果通过combineDocumentsFn函数处理
    // combineDocumentsFn会将多个文档的内容合并成一个字符串
    const retrievalChain = retriever.pipe(combineDocumentsFn);

    // 创建答案生成链：使用检索到的上下文、聊天历史和问题生成答案
    const answerChain = RunnableSequence.from([
      {
        // 准备输入参数
        context: RunnableSequence.from([
          (input) => input.question, // 获取独立问题
          retrievalChain, // 检索相关文档并合并
        ]),
        chat_history: (input) => input.chat_history, // 获取聊天历史
        question: (input) => input.question, // 获取独立问题
      },
      answerPrompt, // 使用答案生成模板
      model, // 调用模型生成答案
    ]);

    // 创建完整的对话检索QA链：将独立问题链和答案链组合
    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain, // 生成独立问题
        chat_history: (input) => input.chat_history, // 传递聊天历史
      },
      answerChain, // 生成答案
      new BytesOutputParser(), // 将输出解析为字节流
    ]);

    // 流式执行对话检索QA链，生成响应
    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent, // 当前用户问题
      chat_history: formatVercelMessages(previousMessages), // 格式化的聊天历史
    });

    // 等待文档检索完成，获取检索到的文档
    const documents = await documentPromise;
    
    // 序列化检索到的文档，用于在响应头中返回
    const serializedSources = Buffer.from(
      JSON.stringify(
        documents.map((doc) => {
          return {
            pageContent: doc.pageContent.slice(0, 100) + "...", // 增加预览长度，提供更多上下文信息
            metadata: doc.metadata, // 文档元数据
          };
        }),
      ),
    ).toString("base64"); // 编码为base64格式

    // 返回流式文本响应，包含生成的答案和检索到的文档
    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(), // 消息索引
        "x-sources": serializedSources, // 序列化的检索源
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}