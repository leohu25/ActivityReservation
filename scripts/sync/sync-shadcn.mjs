#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const SHADCN_DIR = path.join(
	WORKSPACE_ROOT,
	"packages/base/ui/src/components/shadcn",
);
const MANIFEST_PATH = path.join(
	WORKSPACE_ROOT,
	"packages/base/ui/.shadcn-manifest.json",
);

console.log("🚀 开始全量纯净同步官方 shadcn Base UI 组件...");

// 1. 清空当前 shadcn 文件夹，确保任何残留的自定义组件彻底删除
console.log("1. 清空 packages/base/ui/src/components/shadcn/ 目录...");
if (fs.existsSync(SHADCN_DIR)) {
	const existingFiles = fs.readdirSync(SHADCN_DIR);
	for (const file of existingFiles) {
		fs.rmSync(path.join(SHADCN_DIR, file), { force: true, recursive: true });
	}
} else {
	fs.mkdirSync(SHADCN_DIR, { recursive: true });
}

// 2. 调用官方 CLI 全量注入组件
console.log("2. 运行官方 CLI 脚本重新全量注入组件...");
const uiPkgDir = path.join(WORKSPACE_ROOT, "packages/base/ui");
try {
	execSync("npx shadcn@latest add --all -y -o", {
		cwd: uiPkgDir,
		stdio: "inherit",
	});
} catch (error) {
	console.error("执行 npx shadcn add --all 失败:", error);
	throw error;
}

try {
	execSync("npx shadcn@latest add sonner -y -o", {
		cwd: uiPkgDir,
		stdio: "inherit",
	});
} catch (error) {
	console.error("执行 npx shadcn add sonner 失败:", error);
	throw error;
}

// 3. 重新生成纯净的统一 index.ts 导出入口
console.log(
	"3. 重新生成 packages/base/ui/src/components/shadcn/index.ts 统一导出...",
);
const generatedFiles = fs
	.readdirSync(SHADCN_DIR)
	.filter((f) => f.endsWith(".tsx"))
	.sort();

const indexLines = [];
for (const file of generatedFiles) {
	const name = file.replace(/\.tsx$/, "");
	if (name === "toast") {
		// 避免与 sonner 的 Toaster 重名冲突
		indexLines.push(`export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast as baseToast,
} from "./toast";`);
	} else {
		indexLines.push(`export * from "./${name}";`);
	}
}

fs.writeFileSync(
	path.join(SHADCN_DIR, "index.ts"),
	indexLines.join("\n") + "\n",
);

// 4. 重新计算官方源码文件的 sha256 基线并落盘至 .shadcn-manifest.json
console.log("4. 更新防篡改基线哈希清单 .shadcn-manifest.json...");
const allComponents = fs
	.readdirSync(SHADCN_DIR)
	.filter((f) => f.endsWith(".tsx") || f === "index.ts")
	.sort();

const manifest = {
	version: "1.0.0",
	style: "base-nova",
	generatedAt: new Date().toISOString(),
	componentsCount: allComponents.length,
	files: {},
};

for (const compFile of allComponents) {
	const content = fs.readFileSync(path.join(SHADCN_DIR, compFile));
	const hash = crypto.createHash("sha256").update(content).digest("hex");
	manifest.files[compFile] = hash;
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

// 5. 触发门禁自检校验
console.log("5. 运行门禁校验白名单与防篡改规则...");
try {
	execSync(
		`node "${path.join(WORKSPACE_ROOT, "scripts/check/check-shadcn-immutability.mjs")}"`,
		{
			cwd: WORKSPACE_ROOT,
			stdio: "inherit",
		},
	);
} catch (error) {
	console.error("shadcn 门禁自检未通过:", error);
	throw error;
}

console.log(
	`\n✔ 官方 Base UI 组件全量同步与白名单校验成功！共收录 ${allComponents.length} 个官方组件。`,
);
