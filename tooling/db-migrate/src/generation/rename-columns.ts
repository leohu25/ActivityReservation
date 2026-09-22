/**
 * 将 Prisma migrate diff 的同表 DROP COLUMN + ADD COLUMN 改写为更安全的 DDL：
 * 1. 可推导列名配对（如 xxx_snapshot → xxx）→ RENAME COLUMN，保住存量数据；
 * 2. 同名列 DROP+ADD（典型为 @db.Uuid 等原生类型变更）→ ALTER COLUMN SET DATA TYPE，
 *    并用安全 USING 将历史 "system"/非法值映射到系统 UUID，避免整表重建丢数据。
 */

/** 系统操作者 UUID：历史字符串哨兵 "system" 与非法值的落点 */
const SYSTEM_ACTOR_ID = "00000000-0000-7000-8000-000000000000";

function preferRenamePair(dropped: string, added: string): boolean {
  // 仅显式 *_snapshot → * 改名，严禁把同名列当作 rename（那是类型变更）
  return dropped === `${added}_snapshot`;
}

function buildUuidCastSql(column: string, nullable: boolean): string {
  const fallback = nullable
    ? "NULL"
    : `'${SYSTEM_ACTOR_ID}'::uuid`;
  // 避免在 String.replace 替换串中出现 $' 等特殊模式，这里只拼 SQL 文本
  const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
  return `CASE
      WHEN "${column}" IS NULL THEN NULL
      WHEN "${column}" ~* '${uuidPattern}' THEN "${column}"::uuid
      ELSE ${fallback}
    END`;
}

function buildTypeChangeSql(
  table: string,
  column: string,
  typeSpec: string,
): string {
  const normalized = typeSpec.replace(/\s+/g, " ").trim();
  const isNotNull = /\bNOT\s+NULL\b/i.test(normalized);
  const uuidOnly = normalized
    .replace(/\s+NOT\s+NULL/i, "")
    .replace(/\s+DEFAULT\s+(?:'(?:[^']|'')*'|[^\s,]+)/i, "")
    .trim()
    .toUpperCase();

  const alters: string[] = [];
  if (uuidOnly === "UUID") {
    alters.push(
      `ALTER COLUMN "${column}" SET DATA TYPE UUID USING (${buildUuidCastSql(column, !isNotNull)})`,
    );
  } else {
    alters.push(
      `ALTER COLUMN "${column}" SET DATA TYPE ${uuidOnly || normalized}`,
    );
  }

  const defaultMatch = normalized.match(
    /\s+DEFAULT\s+((?:'(?:[^']|'')*'|[^\s,]+))/i,
  );
  if (defaultMatch) {
    alters.push(`ALTER COLUMN "${column}" SET DEFAULT ${defaultMatch[1]}`);
  }
  if (isNotNull) {
    alters.push(`ALTER COLUMN "${column}" SET NOT NULL`);
  }
  return `ALTER TABLE "${table}" ${alters.join(",\n")}`;
}

export function rewriteDropAddColumnsToRenames(sql: string): string {
  if (!sql.includes("DROP COLUMN") || !sql.includes("ADD COLUMN")) {
    return sql;
  }

  let result = sql;
  const alterRe = /ALTER TABLE "([^"]+)"\s+([\s\S]*?);/g;
  const blocks: {
    full: string;
    table: string;
    drops: string[];
    adds: { name: string; typeSpec: string }[];
  }[] = [];

  let match: RegExpExecArray | null;
  while ((match = alterRe.exec(sql)) !== null) {
    const table = match[1];
    const body = match[2];
    const drops: string[] = [];
    const adds: { name: string; typeSpec: string }[] = [];

    const dropRe = /DROP COLUMN "([^"]+)"/g;
    let d: RegExpExecArray | null;
    while ((d = dropRe.exec(body)) !== null) {
      drops.push(d[1]);
    }

    const addRe =
      /ADD COLUMN\s+"([^"]+)"\s+([A-Z]+(?:\([^)]*\))?(?:\s+NOT\s+NULL)?(?:\s+DEFAULT\s+(?:'(?:[^']|'')*'|[^\s,]+))?)/gi;
    let a: RegExpExecArray | null;
    while ((a = addRe.exec(body)) !== null) {
      adds.push({
        name: a[1],
        typeSpec: a[2].replace(/\s+/g, " ").trim(),
      });
    }

    blocks.push({ full: match[0], table, drops, adds });
  }

  for (const block of blocks) {
    if (block.drops.length === 0 || block.adds.length === 0) continue;

    const renames: { dropped: string; added: string }[] = [];
    const typeChanges: { column: string; typeSpec: string }[] = [];
    const usedDrop = new Set<string>();
    const usedAdd = new Set<string>();

    // 1) 同名列 DROP+ADD → 原生类型变更
    for (const dropped of block.drops) {
      const added = block.adds.find(
        (item) => item.name === dropped && !usedAdd.has(item.name),
      );
      if (!added) continue;
      typeChanges.push({ column: dropped, typeSpec: added.typeSpec });
      usedDrop.add(dropped);
      usedAdd.add(added.name);
    }

    // 2) *_snapshot → * 显式改名
    for (const dropped of block.drops) {
      if (usedDrop.has(dropped)) continue;
      for (const added of block.adds) {
        if (usedAdd.has(added.name)) continue;
        if (!preferRenamePair(dropped, added.name)) continue;
        renames.push({ dropped, added: added.name });
        usedDrop.add(dropped);
        usedAdd.add(added.name);
        break;
      }
    }

    if (renames.length === 0 && typeChanges.length === 0) continue;

    const remainingDrops = block.drops.filter((d) => !usedDrop.has(d));
    const remainingAdds = block.adds.filter((a) => !usedAdd.has(a.name));

    const parts: string[] = [];
    for (const change of typeChanges) {
      parts.push(`${buildTypeChangeSql(block.table, change.column, change.typeSpec)};`);
    }
    for (const rename of renames) {
      parts.push(
        `ALTER TABLE "${block.table}" RENAME COLUMN "${rename.dropped}" TO "${rename.added}";`,
      );
    }
    if (remainingDrops.length > 0) {
      parts.push(
        `ALTER TABLE "${block.table}" ${remainingDrops
          .map((d) => `DROP COLUMN "${d}"`)
          .join(", ")};`,
      );
    }
    if (remainingAdds.length > 0) {
      parts.push(
        `ALTER TABLE "${block.table}" ${remainingAdds
          .map((a) => `ADD COLUMN "${a.name}" ${a.typeSpec}`)
          .join(", ")};`,
      );
    }

    // 使用函数替换，避免替换串中的 $' / $$ 被 String.replace 当作特殊模式展开
    result = result.replace(block.full, () => parts.join("\n"));
  }

  return result;
}
