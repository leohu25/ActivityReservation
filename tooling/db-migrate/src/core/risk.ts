import type {
  DestructiveApproval,
  MigrationRisk,
  MigrationRiskCode,
} from "./types";

const RISK_PATTERNS: readonly {
  readonly code: MigrationRiskCode;
  readonly pattern: RegExp;
  readonly message: string;
}[] = [
  {
    code: "DROP_TABLE",
    pattern: /\bDROP\s+TABLE\b/i,
    message: "删除数据表可能造成不可逆数据丢失",
  },
  {
    code: "DROP_COLUMN",
    pattern: /\bDROP\s+COLUMN\b/i,
    message: "删除字段可能造成不可逆数据丢失",
  },
  {
    code: "TRUNCATE",
    pattern: /\bTRUNCATE\b/i,
    message: "清空数据表会删除现有数据",
  },
  {
    code: "ALTER_COLUMN_TYPE",
    pattern: /\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/i,
    message: "字段类型转换可能截断或拒绝现有数据",
  },
  {
    code: "ADD_REQUIRED_COLUMN",
    pattern: /\bADD\s+COLUMN\b(?![^;]*\bDEFAULT\b)[^;]*\bNOT\s+NULL\b/i,
    message: "向已有表增加无默认值的必填字段可能执行失败",
  },
  {
    code: "ADD_UNIQUE_CONSTRAINT",
    pattern: /\bCREATE\s+UNIQUE\s+INDEX\b|\bADD\s+CONSTRAINT\b[^;]*\bUNIQUE\b/i,
    message: "唯一约束可能与现有重复数据冲突",
  },
];

export function detectMigrationRisks(sql: string): MigrationRisk[] {
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  const risks: MigrationRisk[] = [];
  for (const statement of statements) {
    for (const definition of RISK_PATTERNS) {
      if (definition.pattern.test(statement)) {
        risks.push({
          code: definition.code,
          message: definition.message,
          statement: `${statement};`,
        });
      }
    }
  }
  return risks;
}

export function assertRiskApproval(
  risks: readonly MigrationRisk[],
  approval?: DestructiveApproval,
): void {
  if (risks.length === 0) return;
  if (
    !approval?.reason.trim() ||
    !approval.dataPlan.trim() ||
    !approval.rollbackPlan.trim()
  ) {
    throw new Error(
      `Migration contains ${risks.length} destructive/risky operation(s) without a complete approval`,
    );
  }
}
