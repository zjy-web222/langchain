import { Document } from "@langchain/core/documents";

import {
  USER2_SOURCE_METADATA,
  USER2_TABLE,
} from "@/lib/supabase/client";

/** 将 user2 表一行转为可检索的文本 */
export function user2RowToPageContent(row: Record<string, unknown>): string {
  const lines = Object.entries(row)
    .filter(([, value]) => value !== null && value !== undefined)
    .filter(([key]) => !key.toLowerCase().includes("embedding"))
    .map(([key, value]) => {
      const text =
        typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      return `${key}: ${text}`;
    });

  return lines.join("\n");
}

export function user2RowsToDocuments(
  rows: Record<string, unknown>[],
): Document[] {
  return rows.map((row, index) => {
    const rowId = row.id ?? row.uuid ?? index;

    return new Document({
      pageContent: user2RowToPageContent(row),
      metadata: {
        ...USER2_SOURCE_METADATA,
        row_id: rowId,
        table: USER2_TABLE,
      },
    });
  });
}
