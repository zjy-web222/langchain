import { localPrisma } from "./prisma";
import { LOCAL_SOURCE_TABLE } from "./constants";

function resolveSourceTableName(): string {
  const table = process.env.LOCAL_PG_SOURCE_TABLE ?? LOCAL_SOURCE_TABLE;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`非法表名: ${table}`);
  }
  return table;
}

export type LocalSourceFetchResult = {
  rows: Record<string, unknown>[];
  table: string;
};

/** 从本地 Postgres 业务表读取数据 */
export async function fetchLocalSourceRows(): Promise<LocalSourceFetchResult> {
  const table = resolveSourceTableName();
  const rows = await localPrisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM "${table}"`,
  );

  if (!rows.length) {
    throw new Error(
      `本地表 "${table}" 中没有数据。请先在 PostgreSQL 中插入业务数据，或检查 LOCAL_PG_SOURCE_TABLE。`,
    );
  }

  return { rows, table };
}
