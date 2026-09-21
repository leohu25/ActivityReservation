#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "../..");

/**
 * 匹配向已有表新增非空且无默认值列的高危 SQL 模式
 * 典型语句：ALTER TABLE "customer_tag" ADD COLUMN "tag_type_id" VARCHAR(60) NOT NULL;
 */
const NOT_NULL_WITHOUT_DEFAULT_PATTERN =
	/\bADD\s+COLUMN\b(?![^;]*\bDEFAULT\b)[^;]*\bNOT\s+NULL\b/i;

export function inspectMigrationSafety(sqlContent) {
	const violations = [];
	const statements = sqlContent
		.split(";")
		.map((s) => s.trim())
		.filter(Boolean);

	for (const stmt of statements) {
		if (NOT_NULL_WITHOUT_DEFAULT_PATTERN.test(stmt)) {
			violations.push({
				statement: `${stmt};`,
				reason:
					"检测到向已有表增加无 DEFAULT 的 NOT NULL 字段。在包含存量数据的数据库中执行会导致 `contains null values` 致命异常崩溃。",
			});
		}
	}

	return {
		safe: violations.length === 0,
		violations,
	};
}

export function getPendingOrAddedMigrationFiles(workspaceRoot = WORKSPACE_ROOT) {
	let output = "";
	try {
		// 检查已暂存和未暂存的修改与新增文件
		output = execFileSync("git", ["status", "--porcelain", "-uall"], {
			cwd: workspaceRoot,
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		return [];
	}

	const files = [];
	for (const line of output.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		// 提取文件名（跳过前两个状态字符）
		const filePath = trimmed.slice(2).trim();
		const normalized = filePath.replace(/\\/g, "/");
		if (
			normalized.startsWith("tooling/db-migrate/migrations/") &&
			normalized.endsWith("migration.sql")
		) {
			const fullPath = path.join(workspaceRoot, normalized);
			if (fs.existsSync(fullPath)) {
				files.push(fullPath);
			}
		}
	}
	return files;
}

export function runMigrationSafetyCheck(workspaceRoot = WORKSPACE_ROOT) {
	const migrationFiles = getPendingOrAddedMigrationFiles(workspaceRoot);
	if (migrationFiles.length === 0) {
		return { pass: true, checkedCount: 0 };
	}

	const allViolations = [];
	for (const file of migrationFiles) {
		const content = fs.readFileSync(file, "utf-8");
		const inspection = inspectMigrationSafety(content);
		if (!inspection.safe) {
			const relPath = path.relative(workspaceRoot, file).replace(/\\/g, "/");
			allViolations.push({
				file: relPath,
				violations: inspection.violations,
			});
		}
	}

	if (allViolations.length > 0) {
		return {
			pass: false,
			checkedCount: migrationFiles.length,
			violations: allViolations,
		};
	}

	return { pass: true, checkedCount: migrationFiles.length };
}

function main() {
	const result = runMigrationSafetyCheck(WORKSPACE_ROOT);
	if (!result.pass) {
		console.error("\x1b[31m❌ [门禁硬拦截] 数据库平滑演进与存量数据安全检查失败\x1b[0m\n");
		for (const item of result.violations) {
			console.error(`  • 违规迁移文件: \x1b[33m${item.file}\x1b[0m`);
			for (const v of item.violations) {
				console.error(`    - 高危语句: \x1b[90m${v.statement}\x1b[0m`);
				console.error(`    - 风险说明: \x1b[31m${v.reason}\x1b[0m`);
			}
		}
		console.error(
			"\n\x1b[36m💡 架构规范修复指引（老表追加字段 vs 新建表规范）：\x1b[0m\n" +
				"  1. 【老表加字段】：必须在 Prisma Schema 中将新字段设为可选（加 ?），由应用层（Zod/表单）卡必填；\n" +
				"  2. 【老表加必填】：或者在 Prisma 中显式配置 @default(...) 默认值；\n" +
				"  3. 【严禁手写 SQL】：修改 Prisma Schema 后，重新执行 `pnpm db:migrate:generate` 自动生成合规迁移。\n",
		);
		process.exit(1);
	}

	if (result.checkedCount > 0) {
		console.log(
			`• 迁移安全: 已检查 ${result.checkedCount} 个待提交增量迁移，无非空存量崩溃风险`,
		);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
