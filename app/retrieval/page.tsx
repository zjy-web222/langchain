import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import { UploadDocumentsForm } from "@/components/UploadDocumentsForm";

export default function ReadmeRetrievalPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          <span className="ml-2">
            数据源：项目根目录 <code>README.md</code> → 本地{" "}
            <code>vectorstore/documents.json</code>
          </span>
        </li>
        <li className="text-l">
          <span className="ml-2">
            API：<code>app/api/retrieval/ingest</code>（入库）、
            <code>app/api/chat/retrieval</code>（对话）
          </span>
        </li>
        <li className="text-l">
          <UploadDocumentsForm />
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <ChatWindow
      endpoint="/api/chat/retrieval"
      emptyStateComponent={InfoCard}
      showIngestForm={false}
      placeholder='请先导入 README，再提问，例如："项目有哪些 RAG 模块？"'
      emoji="📄"
    />
  );
}
