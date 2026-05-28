import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOllama } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";

import { getOllamaEmbeddings } from "@/lib/db/embeddings";
import { searchLocalSimilarDocuments } from "@/lib/local-pg/vector-store";
import { answerPrompt, condenseQuestionPrompt } from "@/lib/rag/prompts";

export const runtime = "nodejs";

const combineDocumentsFn = (docs: Document[]) =>
  docs.map((doc) => doc.pageContent).join("\n\n");

const formatVercelMessages = (chatHistory: VercelChatMessage[]) =>
  chatHistory
    .map((message) => {
      if (message.role === "user") return `Human: ${message.content}`;
      if (message.role === "assistant") return `Assistant: ${message.content}`;
      return `${message.role}: ${message.content}`;
    })
    .join("\n");

/** 本地 Postgres 向量库 RAG 对话 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    const model = new ChatOllama({
      model: process.env.OLLAMA_CHAT_MODEL ?? "qwen3:4b",
      temperature: 0.1,
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    });

    const embeddings = getOllamaEmbeddings();

    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);

    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const retrievalChain = async (question: string) => {
      const queryEmbedding = await embeddings.embedQuery(question);
      const rows = await searchLocalSimilarDocuments(queryEmbedding, 20);
      const docs = rows.map(
        (row) =>
          new Document({
            pageContent: row.content,
            metadata: (row.metadata ?? {}) as Record<string, unknown>,
          }),
      );
      resolveWithDocuments(docs);
      return combineDocumentsFn(docs);
    };

    const answerChain = RunnableSequence.from([
      {
        context: RunnableSequence.from([
          (input) => input.question,
          retrievalChain,
        ]),
        chat_history: (input) => input.chat_history,
        question: (input) => input.question,
      },
      answerPrompt,
      model,
    ]);

    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain,
        chat_history: (input) => input.chat_history,
      },
      answerChain,
      new BytesOutputParser(),
    ]);

    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: formatVercelMessages(previousMessages),
    });

    const retrievedDocuments = await documentPromise;

    const serializedSources = Buffer.from(
      JSON.stringify(
        retrievedDocuments.map((doc) => ({
          pageContent: doc.pageContent.slice(0, 100) + "...",
          metadata: doc.metadata,
        })),
      ),
    ).toString("base64");

    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
        "x-sources": serializedSources,
      },
    });
  } catch (e: any) {
    console.error("Local PG retrieval error:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
