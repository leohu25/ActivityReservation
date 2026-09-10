/**
 * 模型与字段注释规范校验器
 */
import fs from "node:fs";
import { findSchemaFiles } from "./aggregate.js";
import { extractSchemaComments } from "./comments.js";
import type { MigrationScope } from "../core/types.js";

export interface CommentValidationError {
    readonly scope: MigrationScope;
    readonly file: string;
    readonly modelName: string;
    readonly type: "missing_table_comment" | "missing_column_comment";
    readonly column?: string;
    readonly message: string;
}

const TENANT_EXTENSION_PATTERN =
    /^\/\/\s*@db-migrate-extension\s+([A-Za-z0-9_]+)\s*$/m;

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

export function validateScopeComments(
    workspaceRoot: string,
    scope: MigrationScope,
): CommentValidationError[] {
    const schemaFiles = findSchemaFiles(workspaceRoot, scope);
    const errors: CommentValidationError[] = [];

    for (const filePath of schemaFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        const docs = extractSchemaComments(content);
        const docsMap = new Map(docs.map((d) => [d.modelName, d]));

        // 匹配每个模型块
        const modelBlockRegex =
            /((?:(?:^[ \t]*\/\/[^\n]*\n)|(?:^[ \t]*\/\/\/[^\n]*\n))*)[ \t]*model\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/gm;
        let match: RegExpExecArray | null;

        while ((match = modelBlockRegex.exec(content)) !== null) {
            const commentsAbove = match[1] ?? "";
            const modelName = match[2];
            const body = match[3];

            // 如果是 @db-migrate-extension 扩展模型（真实 owner 在其他包），不强制重复校验表注释和主键注释
            const isExtension = TENANT_EXTENSION_PATTERN.test(commentsAbove);
            if (isExtension) {
                continue;
            }

            const doc = docsMap.get(modelName);

            // 1. 校验表级注释
            if (!doc?.tableComment || !doc.tableComment.trim()) {
                errors.push({
                    scope,
                    file: filePath,
                    modelName,
                    type: "missing_table_comment",
                    message: `[${scope}] 模型 "${modelName}" 缺少表级文档注释 (请在模型上方添加 /// 表中文描述)`,
                });
            }

            // 2. 校验标量物理字段是否都有有效 /// 注释
            const bodyLines = body.split("\n");
            for (const rawLine of bodyLines) {
                const trimmed = rawLine.trim();
                if (
                    !trimmed ||
                    trimmed.startsWith("//") ||
                    trimmed.startsWith("@@")
                ) {
                    continue;
                }

                const tokens = trimmed.split(/\s+/);
                const fieldName = tokens[0];
                const rawType = tokens[1];
                if (!fieldName || !rawType) continue;

                const baseType = rawType.replace(/[?[\]]/g, "");
                if (PRISMA_SCALAR_TYPES.has(baseType)) {
                    const mapMatch = /@map\("([^"]+)"\)/.exec(trimmed);
                    const colName = mapMatch ? mapMatch[1] : fieldName;

                    const comment = doc?.columnComments.get(colName);
                    if (!comment || !comment.trim()) {
                        errors.push({
                            scope,
                            file: filePath,
                            modelName,
                            column: colName,
                            type: "missing_column_comment",
                            message: `[${scope}] 模型 "${modelName}" 的字段 "${fieldName}" (列名: "${colName}") 缺少有效字段注释 (请在字段上方添加 /// 字段解释)`,
                        });
                    }
                }
            }
        }
    }

    return errors;
}
