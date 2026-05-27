export type SupabaseKeyKind = "service_role" | "anon" | "publishable" | "unknown";

export function resolveSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PRIVATE_KEY ??
    process.env.SUPABASE_ANON_KEY
  );
}

export function detectSupabaseKeyKind(key: string): SupabaseKeyKind {
  if (key.startsWith("sb_secret_") || key.includes("service_role")) {
    return "service_role";
  }
  if (key.startsWith("sb_publishable_")) {
    return "publishable";
  }
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
      ) as { role?: string };
      if (payload.role === "service_role") return "service_role";
      if (payload.role === "anon") return "anon";
    } catch {
      // ignore decode errors
    }
  }
  return "unknown";
}

export function assertServerSupabaseKey(key: string): void {
  const kind = detectSupabaseKeyKind(key);
  if (kind === "publishable" || kind === "anon") {
    throw new Error(
      [
        "当前 Supabase 密钥不是 service_role（检测到 publishable/anon 类型）。",
        "在 RLS 开启时，读取 user2 常会返回 0 行，看起来像「表里没有数据」。",
        "请到 Supabase Dashboard → Project Settings → API，",
        "复制 service_role key（通常为 eyJ... 或 sb_secret_...），",
        "写入 .env.local 的 SUPABASE_SERVICE_ROLE_KEY，然后重启 npm run dev。",
      ].join("\n"),
    );
  }
}
