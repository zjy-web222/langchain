import { getUser2SourceMetadata, USER2_TABLE } from "@/lib/db/constants";

import { tableRowsToDocuments } from "./table-rows";

export { tableRowToPageContent } from "./table-rows";

export function user2RowsToDocuments(
  rows: Record<string, unknown>[],
) {
  return tableRowsToDocuments(rows, {
    sourceMetadata: getUser2SourceMetadata(),
    tableName: process.env.PRISMA_USER2_TABLE ?? USER2_TABLE,
  });
}
