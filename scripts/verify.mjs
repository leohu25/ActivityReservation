#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "..");

process.chdir(WORKSPACE_ROOT);

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const NC = "\x1b[0m";

// 静默执行：成功只打一行标签；失败才展开完整日志
// 成功时若日志含自动扩围等关键事件，则透出该行
function runQuiet(label, command, args = [], options = {}) {
	const res = spawnSync(command, args, {
		encoding: "utf-8",
		cwd: WORKSPACE_ROOT,
		...options,
	});

	const stdout = res.stdout || "";
	const stderr = res.stderr || "";
	const combined = stdout + (stderr ? `\n${stderr}` : "");

	if (res.status === 0) {
		if (combined.includes("Auto-Recorded")) {
			const recordedLines = combined
				.split("\n")
				.filter((line) => line.includes("Auto-Recorded"))
				.map((line) => `  ${line}`)
				.join("\n");
			if (recordedLines) {
				console.log(recordedLines);
			}
		}
		console.log(`• ${label}: ${GREEN}通过${NC}`);
		return true;
	}

	console.log(`• ${label}: ${RED}失败${NC}`);
	if (combined.trim()) {
		console.log(combined.trim());
	}
	return false;
}

console.log(`${BLUE}>>> 门禁验证自检${NC}`);

// 1. 元数据校验
const featureListPath = path.join(WORKSPACE_ROOT, "feature_list.json");
if (!fs.existsSync(featureListPath)) {
	console.log(`• 元数据  : ${RED}缺少 feature_list.json${NC}`);
	process.exit(1);
}
try {
	JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
	console.log(`• 元数据  : ${GREEN}合法${NC}`);
} catch {
	console.log(`• 元数据  : ${RED}feature_list.json 非法${NC}`);
	process.exit(1);
}

// 2. 特性沙盒与边界
const resolveFeatureScript = path.join(
	WORKSPACE_ROOT,
	".harness/lifecycle/resolve-feature.mjs",
);
let featInfo = "none|global";
try {
	featInfo = execSync(`node "${resolveFeatureScript}" --source`, {
		encoding: "utf-8",
	}).trim();
} catch {
	featInfo = "none|global";
}
const [activeFeat, featSource] = featInfo.split("|");

if (activeFeat && activeFeat !== "none") {
	console.log(
		`• 特性沙盒: ${GREEN}${activeFeat}${NC} (来源: ${featSource || "unknown"})`,
	);
}

const nodePath = process.execPath;
const checks = [
	{
		label: "沙盒边界",
		cmd: nodePath,
		args: [path.join(WORKSPACE_ROOT, "scripts/check/check-boundary.mjs")],
	},
	{
		label: "红线扫描",
		cmd: nodePath,
		args: [path.join(WORKSPACE_ROOT, "scripts/check/check-redlines.mjs")],
	},
	{
		label: "实体基线",
		cmd: nodePath,
		args: [
			path.join(WORKSPACE_ROOT, "scripts/check/check-entity-baseline.mjs"),
		],
	},
	{
		label: "权限契约",
		cmd: nodePath,
		args: [
			path.join(WORKSPACE_ROOT, "scripts/check/check-permission-contracts.mjs"),
		],
	},
	{
		label: "业务切片",
		cmd: nodePath,
		args: [
			path.join(WORKSPACE_ROOT, "scripts/check/check-vertical-slices.mjs"),
		],
	},
	{
		label: "受控门禁",
		cmd: nodePath,
		args: [
			path.join(WORKSPACE_ROOT, "scripts/check/check-ui-permission-guards.mjs"),
		],
	},
	{
		label: "逻辑外键",
		cmd: nodePath,
		args: [path.join(WORKSPACE_ROOT, "scripts/check/check-relation-mode.mjs")],
	},
	{
		label: "迁移不可变",
		cmd: nodePath,
		args: [
			path.join(
				WORKSPACE_ROOT,
				"scripts/check/check-migration-immutability.mjs",
			),
		],
	},
	{
		label: "门禁单测",
		cmd: nodePath,
		args: [
			"--test",
			path.join(WORKSPACE_ROOT, "scripts/check/check-redlines.test.mjs"),
			path.join(WORKSPACE_ROOT, "scripts/check/check-vertical-slices.test.mjs"),
			path.join(WORKSPACE_ROOT, "scripts/check/check-entity-baseline.test.mjs"),
			path.join(
				WORKSPACE_ROOT,
				"scripts/check/check-ui-permission-guards.test.mjs",
			),
			path.join(WORKSPACE_ROOT, "scripts/check/check-relation-mode.test.mjs"),
			path.join(
				WORKSPACE_ROOT,
				"scripts/check/check-migration-immutability.test.mjs",
			),
		],
	},
];

for (const check of checks) {
	if (!runQuiet(check.label, check.cmd, check.args)) {
		process.exit(1);
	}
}

// 8. 类型检查
const pkgJsonPath = path.join(WORKSPACE_ROOT, "package.json");
const nodeModulesPath = path.join(WORKSPACE_ROOT, "node_modules");
if (fs.existsSync(pkgJsonPath) && fs.existsSync(nodeModulesPath)) {
	let pkg = null;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
	} catch {
		pkg = null;
	}
	if (pkg?.scripts?.check) {
		if (!runQuiet("类型扫描", "pnpm", ["--silent", "check"])) {
			process.exit(1);
		}
	}
} else {
	console.log(`• 代码检查: ${YELLOW}跳过 (尚未初始化 node_modules)${NC}`);
}

console.log(`${GREEN}✔ 门禁验证通过${NC}`);
