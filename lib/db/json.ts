/** Prisma $queryRaw 会把 Postgres bigint 转成 JS BigInt，需先转换再 JSON.stringify */
export function jsonSafeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") {
      return val.toString();
    }
    return val;
  });
}

/** 递归将对象中的 BigInt 转为 string，便于写入 jsonb metadata */
export function sanitizeForJson<T>(value: T): T {
  if (typeof value === "bigint") {
    return value.toString() as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForJson(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeForJson(v),
      ]),
    ) as T;
  }
  return value;
}
