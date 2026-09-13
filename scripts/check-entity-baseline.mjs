#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);

function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

const workspaceRoot = findWorkspaceRoot();

/**
 * 业务实体基础字段要求（标准 ERP 基线规范）：
 * 1. createdById: String (必填，创建人 ID)
 * 2. deptId: String? (选填/可空，归属部门 ID，支撑数据范围 SELF / DEPT / DEPT_TREE)
 * 3. updatedById: String? (选填/可空，更新人 ID)
 * 4. createdAt: DateTime (必填，创建时间)
 * 5. updatedAt: DateTime (必填，更新时间)
 * 6. isDeleted: Boolean (必填，软删除标记)
 * 7. deletedAt: DateTime? (选填/可空，软删除时间)
 * 8. deletedById: String? (选填/可空，软删除人 ID)
 */
export const REQUIRED_AUDIT_FIELDS = [
  { name: "createdById", type: "String" },
  { name: "deptId", type: "String?" },
  { name: "updatedById", type: "String?" },
  { name: "createdAt", type: "DateTime" },
  { name: "updatedAt", type: "DateTime" },
  { name: "isDeleted", type: "Boolean" },
  { name: "deletedAt", type: "DateTime?" },
  { name: "deletedById", type: "String?" },
];

/**
 * 豁免清单：系统级基础设施表、只读字典表、纯关联关系表 (中间表/多对多分配表)
 */
export const EXEMPT_MODELS = new Set([
  // 租户系统组织与档案（组织架构基座模型自带独立生命周期与状态）
  "Department",
  "Position",
  "EmployeeProfile",
  "CompanyProfile",
  // 纯多对多中间关联表 / 只读配置字典表
  "CustomerTagAssignment",
  "CustomerTag",
  "CustomerCategory",
  "CustomerQuoteItem", // 作为明细从表，归属于主表生命周期
  "SalesOrderItem", // 销售订单明细从表，归属于主表生命周期
  "SalesOrderFee", // 销售订单费用从表，具有独立复核流与审计字段
  // Control DB 认证与管控系统表
  "User",
  "Session",
  "Account",
  "Verification",
  "Member",
  "Organization",
  "Invitation",
  "TwoFactor",
  "AuditLog",
  "RateLimit",
  "SystemSetting",
  "TenantDatabase",
  "TenantContextMetadata",
  "TenantSecurityLog",
  "TenantDomain",
  "RolePermissionAssignment",
  "TenantSubscription",
]);

/**
 * 提取指定 schema 文件中的所有 model 及其字段定义
 */
export function parsePrismaModels(schemaContent) {
  const models = new Map();
  const modelPattern = /model\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\}/g;
  let match;

  while ((match = modelPattern.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields = new Map();

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

      const tokens = line.split(/\s+/);
      const fieldName = tokens[0];
      const fieldType = tokens[1];
      if (fieldName && fieldType) {
        fields.set(fieldName, { type: fieldType, raw: line });
      }
    }

    models.set(modelName, fields);
  }

  return models;
}

/**
 * 检查单个模型是否符合基础审计字段规范
 */
export function validateModelBaseline(modelName, fields) {
  if (EXEMPT_MODELS.has(modelName)) {
    return { ok: true, errors: [] };
  }

  const errors = [];

  for (const required of REQUIRED_AUDIT_FIELDS) {
    const field = fields.get(required.name);
    if (!field) {
      errors.push(
        `缺少必要的基础审计字段: ${required.name} (${required.type})`,
      );
      continue;
    }

    // 检查字段类型匹配 (处理可选标记 ? 与默认类型)
    const expectedType = required.type.replace("?", "");
    const actualType = field.type.replace("?", "");
    const isOptionalExpected = required.type.endsWith("?");
    const isOptionalActual = field.type.endsWith("?");

    if (actualType !== expectedType) {
      errors.push(
        `字段 ${required.name} 类型不符合要求: 期望 ${required.type}，实际为 ${field.type}`,
      );
    } else if (isOptionalExpected && !isOptionalActual) {
      // 如果基线允许为可选 (String?)，模型定义为更严格的必填 (String) 也符合安全基线
    } else if (isOptionalExpected !== isOptionalActual) {
      errors.push(
        `字段 ${required.name} 可空属性不匹配: 期望 ${required.type}，实际为 ${field.type}`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * 执行扫描主流程
 */
export function runBaselineCheck(rootDir = workspaceRoot) {
  const schemaFiles = [];
  const tenantSchema = path.join(
    rootDir,
    "packages/db-tenant/prisma/schema.prisma",
  );
  if (fs.existsSync(tenantSchema)) schemaFiles.push(tenantSchema);

  const featuresDir = path.join(rootDir, "packages/features");
  if (fs.existsSync(featuresDir)) {
    for (const feat of fs.readdirSync(featuresDir)) {
      const featSchema = path.join(featuresDir, feat, "prisma/schema.prisma");
      if (fs.existsSync(featSchema)) {
        schemaFiles.push(featSchema);
      }
    }
  }

  const results = [];
  let totalViolations = 0;

  for (const file of schemaFiles) {
    const relFile = path.relative(rootDir, file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf-8");
    const models = parsePrismaModels(content);

    for (const [modelName, fields] of models) {
      const res = validateModelBaseline(modelName, fields);
      if (!res.ok) {
        totalViolations += res.errors.length;
        results.push({
          file: relFile,
          model: modelName,
          errors: res.errors,
        });
      }
    }
  }

  return {
    totalViolations,
    results,
  };
}

// 仅在直接执行 CLI 时输出并决定退出码
const isMainScript = Boolean(
  process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(currentFilePath),
);

if (isMainScript) {
  const { totalViolations, results } = runBaselineCheck();

  if (totalViolations === 0) {
    process.stdout.write("• 实体基线: 全部业务实体审计与软删除规范校验通过\n");
    process.exit(0);
  } else {
    process.stderr.write(
      `• 实体基线: 发现 ${totalViolations} 处实体基线规范违规:\n`,
    );
    for (const r of results) {
      process.stderr.write(`  [${r.file}] Model '${r.model}':\n`);
      for (const err of r.errors) {
        process.stderr.write(`    - ${err}\n`);
      }
    }
    process.exit(1);
  }
}
