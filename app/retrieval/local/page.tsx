import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import { SyncLocalPgButton } from "@/components/SyncLocalPgButton";

export default function LocalPgRetrievalPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          <span className="ml-2">
            数据源：本地 PostgreSQL 业务表 → 向量表{" "}
            <code>documents</code>（Prisma + pgvector）
          </span>
        </li>
        <li className="text-l">
          <span className="ml-2">
            首次使用请执行{" "}
            <code>local-pg/migrations/001_setup.sql</code>，并配置{" "}
            <code>LOCAL_DATABASE_URL</code>
          </span>
        </li>
        <li className="text-l">
          <SyncLocalPgButton />
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <ChatWindow
      endpoint="/api/retrieval/local"
      emptyStateComponent={InfoCard}
      showIngestForm={false}
      placeholder='请先同步本地库，再提问，例如："本地表里有哪些记录？"'
      emoji="🐘"
    />
  );
}
