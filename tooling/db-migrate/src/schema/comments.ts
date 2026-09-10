/**
 * Prisma Schema AST 注释提取器与 PostgreSQL COMMENT ON 语句生成器
 */

export interface ModelDocumentation {
  readonly modelName: string;
  readonly tableName: string;
  readonly tableComment?: string;
  readonly columnComments: Map<string, string>; // columnName -> comment
}

/**
 * 转义 SQL 单引号
 */
function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

const PRISMA_SCALAR_TYPES = new Set([
  "String",
  "Boolean",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "DateTime",
  "Json",
  "Bytes",
]);

/**
 * 解析 Prisma Schema 中的 /// 注释并提取表名、字段名和对应注释
 */
export function extractSchemaComments(
  schemaContent: string,
): ModelDocumentation[] {
  const results: ModelDocumentation[] = [];

  const enumNames = new Set<string>();
  const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{/g;
  let enumMatch: RegExpExecArray | null;
  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    enumNames.add(enumMatch[1]);
  }

  const modelRegex =
    /((?:^[ \t]*\/\/\/[^\n]*\n)*)[ \t]*model\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/gm;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const docCommentsAbove = modelMatch[1] || "";
    const modelName = modelMatch[2];
    const body = modelMatch[3];

    let tableComment: string | undefined;
    const tableCommentLines = docCommentsAbove.split("\n").flatMap((l) => {
      const trimmed = l.trim();
      return trimmed.startsWith("///")
        ? [trimmed.replace(/^\/\/\/\s?/, "").trim()]
        : [];
    });
    if (tableCommentLines.length > 0) {
      tableComment = tableCommentLines.join(" ");
    }

    const mapTableMatch = /@@map\("([^"]+)"\)/.exec(body);
    const tableName = mapTableMatch ? mapTableMatch[1] : modelName;

    const columnComments = new Map<string, string>();
    const bodyLines = body.split("\n");
    let accumulatedFieldDoc: string[] = [];

    for (const rawLine of bodyLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("///")) {
        accumulatedFieldDoc.push(trimmed.replace(/^\/\/\/\s?/, "").trim());
        continue;
      }

      if (trimmed.startsWith("//")) {
        continue;
      }

      if (trimmed.startsWith("@@")) {
        accumulatedFieldDoc = [];
        continue;
      }

      if (accumulatedFieldDoc.length > 0) {
        const fieldDoc = accumulatedFieldDoc.join(" ");
        accumulatedFieldDoc = [];

        const fieldTokens = trimmed.split(/\s+/);
        const fieldName = fieldTokens[0];
        const rawFieldType = fieldTokens[1];
        if (!fieldName || !rawFieldType) continue;

        const baseType = rawFieldType.replace(/[?[\]]/g, "");
        const isColumn =
          PRISMA_SCALAR_TYPES.has(baseType) || enumNames.has(baseType);
        if (!isColumn) continue;

        const mapColumnMatch = /@map\("([^"]+)"\)/.exec(trimmed);
        const columnName = mapColumnMatch ? mapColumnMatch[1] : fieldName;

        columnComments.set(columnName, fieldDoc);
      }
    }

    results.push({
      modelName,
      tableName,
      tableComment,
      columnComments,
    });
  }

  return results;
}

/**
 * 根据提取的注释生成 PostgreSQL COMMENT ON 语句
 */
export function generatePostgresCommentsSql(
  docs: readonly ModelDocumentation[],
): string {
  const statements: string[] = [];

  for (const doc of docs) {
    const modelStatements: string[] = [];

    if (doc.tableComment) {
      modelStatements.push(
        `COMMENT ON TABLE "${doc.tableName}" IS '${escapeSqlString(doc.tableComment)}';`,
      );
    }

    for (const [columnName, comment] of doc.columnComments) {
      modelStatements.push(
        `COMMENT ON COLUMN "${doc.tableName}"."${columnName}" IS '${escapeSqlString(comment)}';`,
      );
    }

    if (modelStatements.length > 0) {
      statements.push(...modelStatements);
    }
  }

  return statements.join("\n");
}
