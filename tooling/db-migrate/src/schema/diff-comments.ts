/**
 * 计算两个 Schema 注释版本的增量变更 SQL (Diff)
 */
import { extractSchemaComments, type ModelDocumentation } from "./comments.js";

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

export function diffCommentsSql(
  fromSchemaContent: string,
  toSchemaContent: string,
): string {
  const fromDocs = extractSchemaComments(fromSchemaContent);
  const toDocs = extractSchemaComments(toSchemaContent);

  const fromMap = new Map<string, ModelDocumentation>();
  for (const d of fromDocs) fromMap.set(d.tableName, d);

  const statements: string[] = [];

  for (const toDoc of toDocs) {
    const fromDoc = fromMap.get(toDoc.tableName);

    // 1. 表注释新增或修改
    if (
      toDoc.tableComment &&
      (!fromDoc || fromDoc.tableComment !== toDoc.tableComment)
    ) {
      statements.push(
        `COMMENT ON TABLE "${toDoc.tableName}" IS '${escapeSqlString(toDoc.tableComment)}';`,
      );
    }

    // 2. 字段注释新增或修改
    for (const [colName, toComment] of toDoc.columnComments) {
      const fromComment = fromDoc?.columnComments.get(colName);
      if (fromComment !== toComment) {
        statements.push(
          `COMMENT ON COLUMN "${toDoc.tableName}"."${colName}" IS '${escapeSqlString(toComment)}';`,
        );
      }
    }
  }

  return statements.join("\n");
}
