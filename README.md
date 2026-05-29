# LangChain RAG Chat

基于 **Next.js 15**、**LangChain.js**、**Ollama** 与 **Prisma** 的多路 RAG（检索增强生成）对话应用。支持三种数据来源：项目 README、Supabase 云端 PostgreSQL、本地 PostgreSQL。

## 功能概览

| 模块 | 路径 | 数据来源 | 向量存储 |
|------|------|----------|----------|
| 基础对话 | `/` | 无（纯 LLM） | — |
| README RAG | `/retrieval` | 项目根目录 `README.md` | 本地 `vectorstore/` |
| Supabase RAG | `/retrieval/postgres` | Supabase 表 `user2` | Supabase `documents` |
| 本地 PG RAG | `/retrieval/local` | 本地表 `local_source` | 本地 `documents` |

所有 RAG 模块均使用 **Ollama** 本地模型：

- 对话：`qwen3:4b`（可配置）
- 向量：`qwen3-embedding:4b`（2560 维，`halfvec`）

## 技术栈

- **框架**：Next.js 15、React 18、TypeScript
- **AI**：LangChain.js（LCEL）、Vercel AI SDK
- **模型**：Ollama（本地 LLM + Embedding）
- **数据库**：Prisma + PostgreSQL + pgvector
- **UI**：Tailwind CSS、Radix UI、Sonner

## 项目结构

```
app/
├── api/
│   ├── chat/                    # 基础流式对话
│   ├── chat/retrieval/          # README RAG 对话
│   └── retrieval/
│       ├── ingest/              # README.md → 本地向量库
│       ├── postgres/            # Supabase RAG 对话 + ingest + debug
│       └── local/               # 本地 PG RAG 对话 + ingest + debug
├── retrieval/                   # 三个 RAG 前端页面
lib/
├── db/                          # Supabase 库：连接、向量、user2 读取
├── local-pg/                    # 本地库：独立 Prisma 连接与向量
├── rag/                         # 共用 Prompt、README 路径、表行转 Document
└── prisma.ts                    # Supabase Prisma 单例
prisma/schema.prisma             # documents 向量表模型
supabase/migrations/             # Supabase 建表 SQL
local-pg/migrations/             # 本地 PG 建表 SQL
components/                      # ChatWindow、同步按钮等
```

## 快速开始

### 1. 环境要求

- Node.js ≥ 18
- [Ollama](https://ollama.com/) 已安装并拉取模型：
  ```bash
  ollama pull qwen3:4b
  ollama pull qwen3-embedding:4b
  ```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并按需填写：

```env
# README RAG（可选，默认 README.md）
LOCAL_RAG_SOURCE_FILE="README.md"

# Supabase RAG
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
PRISMA_USER2_TABLE="user2"

# 本地 PG RAG
LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/langchain_local"
LOCAL_PG_SOURCE_TABLE="local_source"
LOCAL_PG_EMBEDDING_COLUMN_TYPE="halfvec"

# Ollama
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_CHAT_MODEL="qwen3:4b"
OLLAMA_EMBEDDING_MODEL="qwen3-embedding:4b"
OLLAMA_EMBEDDING_DIMENSIONS="2560"
```

### 4. 初始化数据库

**Supabase**：在 SQL Editor 执行 `supabase/migrations/001_langchain_documents.sql`

**本地 PostgreSQL**：

```bash
psql -U postgres -d langchain_local -f local-pg/migrations/001_setup.sql
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 各模块使用说明

### README RAG

本模块以**当前项目根目录的 `README.md`** 为知识库（即本文档），适合演示「对项目文档提问」。

1. 确保 Ollama 已启动，且已拉取 embedding 模型
2. 打开 `/retrieval`，点击「导入 README 并向量化」
3. 在对话框中提问，例如：
   - 「项目有哪些 RAG 模块？」
   - 「Supabase RAG 怎么配置？」
   - 「向量维度是多少？」

修改 `README.md` 后需重新点击导入，向量库才会更新。也可通过环境变量 `LOCAL_RAG_SOURCE_FILE` 指定其他 Markdown 文件。

### Supabase RAG

1. 配置 `DATABASE_URL`（Supabase Connection pooler）
2. 确保 `user2` 表有数据
3. 打开 `/retrieval/postgres`，点击「从 user2 同步到向量库」
4. 对话检索

诊断接口：`GET /api/retrieval/postgres/debug`

### 本地 PG RAG

1. 配置 `LOCAL_DATABASE_URL`
2. 执行 `local-pg/migrations/001_setup.sql`
3. 向 `local_source` 表插入数据
4. 打开 `/retrieval/local`，同步后对话

诊断接口：`GET /api/retrieval/local/debug`

## RAG 流程

```
业务数据 → 文本切块 → Ollama Embedding → 写入向量表
                                              ↓
用户提问 → 问题改写（结合历史）→ 向量相似度检索 → LLM 基于 context 回答
```

Supabase / 本地 PG 模块通过 **Prisma `$queryRaw`** 读写 Postgres，不使用 Supabase JS SDK。

## 常用命令

```bash
npm run dev          # 开发
npm run build        # 构建
npm run lint         # 代码检查
npx prisma generate  # 生成 Prisma Client
npx prisma studio    # 可视化查看 documents 表（需 DATABASE_URL）
```

## 注意事项

- `.env.local` 含敏感信息，勿提交到 Git
- 2560 维向量需使用 `halfvec(2560)`，HNSW 索引对 `vector` 类型有 2000 维上限
- `vectorstore/` 为 README RAG 本地缓存，已加入 `.gitignore`
- 密码含 `@` 等特殊字符时，连接串需 URL 编码（`@` → `%40`）

## License

MIT（基于 [langchain-nextjs-template](https://github.com/langchain-ai/langchain-nextjs-template) 扩展）
