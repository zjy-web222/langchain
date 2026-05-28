export function getLocalDatabaseUrl(): string {
  const raw = process.env.LOCAL_DATABASE_URL;
  if (!raw) {
    throw new Error(
      "缺少 LOCAL_DATABASE_URL。示例：postgresql://postgres:123456@localhost:5432/langchain_local",
    );
  }

  const url = new URL(raw);
  if (!url.searchParams.has("sslmode") && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    url.searchParams.set("sslmode", "require");
  }
  return url.toString();
}
