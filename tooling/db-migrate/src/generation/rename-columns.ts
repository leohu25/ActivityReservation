/**
 * 将 Prisma migrate diff 的同表 DROP COLUMN + ADD COLUMN 改写为 RENAME COLUMN。
 * 优先按可推导列名配对（如 xxx_snapshot → xxx），保住存量数据。
 */

function preferRenamePair(dropped: string, added: string): boolean {
  if (dropped === `${added}_snapshot`) return true;
  if (added === dropped.replace(/_snapshot$/, "")) return true;
  return false;
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
    const usedDrop = new Set<string>();
    const usedAdd = new Set<string>();

    for (const dropped of block.drops) {
      for (const added of block.adds) {
        if (usedAdd.has(added.name)) continue;
        if (!preferRenamePair(dropped, added.name)) continue;
        renames.push({ dropped, added: added.name });
        usedDrop.add(dropped);
        usedAdd.add(added.name);
        break;
      }
    }

    // 唯一 DROP + 唯一 ADD 且类型一致时，按改名处理
    if (
      renames.length === 0 &&
      block.drops.length === 1 &&
      block.adds.length === 1
    ) {
      const onlyType = block.adds[0].typeSpec;
      // 无法从 DROP 读类型；仅当 ADD 为常见等宽类型时保守改名
      if (/^(TEXT|VARCHAR|UUID|BOOLEAN|INTEGER|TIMESTAMP)/i.test(onlyType)) {
        renames.push({
          dropped: block.drops[0],
          added: block.adds[0].name,
        });
        usedDrop.add(block.drops[0]);
        usedAdd.add(block.adds[0].name);
      }
    }

    if (renames.length === 0) continue;

    const remainingDrops = block.drops.filter((d) => !usedDrop.has(d));
    const remainingAdds = block.adds.filter((a) => !usedAdd.has(a.name));

    const parts: string[] = [];
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

    result = result.replace(block.full, parts.join("\n"));
  }

  return result;
}
