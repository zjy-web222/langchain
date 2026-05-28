import { Document } from "@langchain/core/documents";

import { jsonSafeStringify, sanitizeForJson } from "@/lib/db/json";

/** 将数据库一行转为可检索文本 */
export function tableRowToPageContent(row: Record<string, unknown>): string {
  return Object.entries(row)
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
    })
    .join("\n");
}

export function tableRowsToDocuments(
  rows: Record<string, unknown>[],
  options: {
    sourceMetadata: Record<string, unknown>;
    tableName: string;
  },
): Document[] {
  return rows.map((row, index) => {
    const rowId = row.id ?? row.uuid ?? index;
    const safeRowId =
      typeof rowId === "bigint" ? rowId.toString() : rowId;

    return new Document({
      pageContent: tableRowToPageContent(row),
      metadata: sanitizeForJson({
        ...options.sourceMetadata,
        row_id: safeRowId,
        table: options.tableName,
      }),
    });
  });
}
