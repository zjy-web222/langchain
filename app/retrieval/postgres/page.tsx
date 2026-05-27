import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import { SyncUser2Button } from "@/components/SyncUser2Button";

export default function SupabaseRetrievalPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          <span className="ml-2">
            数据源：Supabase 表 <code>user2</code> → 向量表{" "}
            <code>documents</code>（pgvector）
          </span>
        </li>
        <li className="text-l">
          <span className="ml-2">
            先点击同步，再在下方向量检索问答。API：{" "}
            <code>app/api/retrieval/postgres</code>
          </span>
        </li>
        <li className="text-l">
          <SyncUser2Button />
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <ChatWindow
      endpoint="/api/retrieval/postgres"
      emptyStateComponent={InfoCard}
      showIngestForm={false}
      placeholder='请先同步 user2，再提问，例如："表里有哪些用户？"'
      emoji="🗄️"
    />
  );
}
