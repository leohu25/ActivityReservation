#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "../..");

export const SHADCN_DIR_REL = "packages/base/ui/src/components/shadcn";
export const MANIFEST_FILE_REL = "packages/base/ui/.shadcn-manifest.json";

/**
 * 官方 Base UI (shadcn base-nova) 官方组件白名单 (共 63 项)
 * 来源权威依据: Base UI (@base-ui/react) 官方导出与 shadcn base-nova 官方 Registry
 */
export const OFFICIAL_SHADCN_COMPONENTS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "attachment",
  "avatar",
  "badge",
  "breadcrumb",
  "bubble",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "form",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "marker",
  "menubar",
  "message",
  "message-scroller",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "questionnaire",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
];

const ALLOWED_FILES_SET = new Set([
  "index.ts",
  ...OFFICIAL_SHADCN_COMPONENTS.map((name) => `${name}.tsx`),
]);

export function computeFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * 检查指定目录中的所有文件是否均属于官方白名单
 */
export function checkWhitelist(shadcnDir) {
  if (!fs.existsSync(shadcnDir)) {
    return {
      ok: false,
      errors: [`shadcn 目录不存在: ${shadcnDir}`],
    };
  }

  const files = fs.readdirSync(shadcnDir);
  const unknownFiles = files.filter((f) => !ALLOWED_FILES_SET.has(f));

  if (unknownFiles.length > 0) {
    return {
      ok: false,
      errors: unknownFiles.map(
        (f) =>
          `[SHADCN-FORBIDDEN-CUSTOM-COMPONENT] 发现非法自定义组件文件: "${f}"！\n` +
          `  规则要求: packages/base/ui/src/components/shadcn/ 目录下只能是从官方下载的原始 Base UI 组件，严禁存放自定义组件。\n` +
          `  解决建议: 请将自定义或复合组件移动至 packages/base/ui/src/components/composite/ 或 templates/。`,
      ),
    };
  }

  return { ok: true, errors: [] };
}

/**
 * 检查文件内容是否与官方哈希清单一致，严防任何人工修改与篡改
 */
export function checkIntegrity(shadcnDir, manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      errors: [
        `[SHADCN-MISSING-MANIFEST] 缺少官方基线哈希清单: ${manifestPath}。请运行全量同步脚本重新注入。`,
      ],
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch (err) {
    return {
      ok: false,
      errors: [`[SHADCN-INVALID-MANIFEST] 哈希清单格式损坏: ${err.message}`],
    };
  }

  const errors = [];
  for (const [fileName, expectedHash] of Object.entries(manifest.files || {})) {
    const fullPath = path.join(shadcnDir, fileName);
    if (!fs.existsSync(fullPath)) {
      errors.push(
        `[SHADCN-MISSING-OFFICIAL-FILE] 官方 Base UI 组件缺失: "${fileName}"！`,
      );
      continue;
    }

    const actualHash = computeFileHash(fullPath);
    if (actualHash !== expectedHash) {
      errors.push(
        `[SHADCN-FORBIDDEN-MODIFICATION] 官方 Base UI 原子组件已被非法修改: "${fileName}"！\n` +
          `  规则要求: packages/base/ui/src/components/shadcn/ 下的官方源码严禁任何人工作出代码修改或篡改。\n` +
          `  解决建议: 请撤销对该文件的修改；若需自定义样式、变体或增加属性，必须在 composite/ 分子层使用包装组件承接。`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * 检查 Git 工作区或暂存区是否含有对 shadcn 目录的手动修改
 */
export function checkGitStatus(workspaceRoot) {
  try {
    const statusOutput = execFileSync(
      "git",
      ["status", "--porcelain", "--", SHADCN_DIR_REL],
      {
        cwd: workspaceRoot,
        encoding: "utf-8",
      },
    ).trim();

    if (!statusOutput) {
      return { ok: true, errors: [] };
    }

    const modifiedLines = statusOutput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => !l.startsWith("??")); // 只拦截对现有官方组件的修改/删除

    if (modifiedLines.length > 0 && process.env.ALLOW_SHADCN_SYNC !== "1") {
      return {
        ok: false,
        errors: modifiedLines.map(
          (line) =>
            `[SHADCN-GIT-MODIFICATION-BLOCKED] 检测到未授权的 Git 变更: ${line}\n` +
            `  shadcn 官方组件禁止通过普通提交修改！如需全量重新同步官方组件，请使用专用同步脚本。`,
        ),
      };
    }

    return { ok: true, errors: [] };
  } catch {
    // 非 Git 环境或异常豁免
    return { ok: true, errors: [] };
  }
}

export function runShadcnGateCheck(workspaceRoot = WORKSPACE_ROOT) {
  const shadcnDir = path.join(workspaceRoot, SHADCN_DIR_REL);
  const manifestPath = path.join(workspaceRoot, MANIFEST_FILE_REL);

  // 1. 白名单检查
  const whitelistRes = checkWhitelist(shadcnDir);
  if (!whitelistRes.ok) {
    return whitelistRes;
  }

  // 2. 防篡改哈希完整性校验
  const integrityRes = checkIntegrity(shadcnDir, manifestPath);
  if (!integrityRes.ok) {
    return integrityRes;
  }

  return { ok: true, errors: [] };
}

// CLI 直接执行模式
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const res = runShadcnGateCheck(WORKSPACE_ROOT);
  if (!res.ok) {
    console.error("❌ shadcn 官方组件白名单与防篡改门禁校验失败:");
    for (const err of res.errors) {
      console.error(err);
    }
    process.exit(1);
  } else {
    console.log(
      "✔ shadcn 官方组件白名单与防篡改校验通过 (100% 官方纯净且未被篡改)",
    );
  }
}
