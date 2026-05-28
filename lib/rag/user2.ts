import { Document } from "@langchain/core/documents";

import { jsonSafeStringify, sanitizeForJson } from "@/lib/db/json";
import { getUser2SourceMetadata, USER2_TABLE } from "@/lib/db/constants";

/** 将 user2 表一行转为可检索的文本 */
export function user2RowToPageContent(row: Record<string, unknown>): string {
  const lines = Object.entries(row)
    .filter(([, value]) => value !== null && value !== undefined)
    .filter(([key]) => !key.toLowerCase().includes("embedding"))
    .map(([key, value]) => {
      const text =
        typeof value === "object"
          ? jsonSafeStringify(value)
          : typeof value === "bigint"
            ? value.toString()
            : String(value);
      return `${key}: ${text}`;
    });

  return lines.join("\n");
}

export function user2RowsToDocuments(
  rows: Record<string, unknown>[],
): Document[] {
  const sourceMeta = getUser2SourceMetadata();

  return rows.map((row, index) => {
    const rowId = row.id ?? row.uuid ?? index;
    const safeRowId =
      typeof rowId === "bigint" ? rowId.toString() : rowId;

    return new Document({
      pageContent: user2RowToPageContent(row),
      metadata: sanitizeForJson({
        ...sourceMeta,
        row_id: safeRowId,
        table: process.env.PRISMA_USER2_TABLE ?? USER2_TABLE,
      }),
    });
  });
}
