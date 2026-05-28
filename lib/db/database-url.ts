/**
 * 规范化 Prisma 用的 DATABASE_URL（Supabase 需 sslmode=require）。
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "缺少 DATABASE_URL。请到 Supabase → Project Settings → Database → Connection string，" +
        "复制 URI（推荐 Transaction pooler，端口 6543）写入 .env.local。",
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      "DATABASE_URL 格式无效。密码含 @、# 等特殊字符时请 URL 编码（@ → %40）。",
    );
  }

  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  // Prisma + Supabase Transaction pooler 建议开启
  if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

export function getDatabaseConnectionHint(error: unknown): string | undefined {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("Authentication failed") || msg.includes("credentials")) {
    return [
      "数据库账号或密码错误（Authentication failed）。请检查：",
      "1. 使用的是 Supabase「Database password」（Settings → Database），不是 anon/service_role API Key。",
      "2. 在 Dashboard 点击 Reset database password 后，把新密码写入 .env.local 的 DATABASE_URL。",
      "3. 密码含 @ # % 等须 URL 编码：@ → %40，# → %23，% → %25。",
      "4. Pooler 连接用户名格式为 postgres.项目ref（你当前应为 postgres.klbwkpghpfqlrtkzytok）。",
      "5. 从 Dashboard 重新复制 Transaction pooler (6543) 整段 URI，避免手改漏字符。",
    ].join("\n");
  }

  if (!msg.includes("Can't reach database server")) {
    return undefined;
  }

  return [
    "无法连接数据库服务器，常见原因：",
    "1. 使用了直连地址 db.xxx.supabase.co:5432，当前网络/地区可能被阻断 → 请改用 Dashboard 里的 Connection pooler（Transaction mode，端口 6543）。",
    "2. DATABASE_URL 中密码含 @ 未编码 → 将 @ 写成 %40。",
    "3. Supabase 项目已暂停 → 在控制台恢复项目。",
    "4. 连接串缺少 SSL → 已自动添加 ?sslmode=require，若仍失败请核对 Dashboard 复制的完整 URI。",
  ].join("\n");
}
