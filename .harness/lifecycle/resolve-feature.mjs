import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

/**
 * 三级自适应解析当前激活的特性 ID：
 * 1. 本地 member.local.md (最高优先级，本地会话覆写)
 * 2. 当前 Git 分支名 (feat/<id>, feature/<id>, fix/<id>)
 * 3. feature_list.json 中状态为 in_progress 的特性
 * 4. 全局模式 (null)
 *
 * @param {string} workspaceRoot
 * @returns {{ id: string | null, source: string, developer?: string, role?: string }}
 */
export function resolveActiveFeature(workspaceRoot = process.cwd()) {
  // 1. 本地 member.local.md 优先
  const memberFile = path.join(workspaceRoot, "member.local.md");
  if (fs.existsSync(memberFile)) {
    try {
      const content = fs.readFileSync(memberFile, "utf-8");
      const matchFeat = content.match(
        /active_feature_id:\s*["']?([^"'\s]+)["']?/,
      );
      const matchDev = content.match(/developer:\s*["']?([^"'\s]+)["']?/);
      const matchRole = content.match(/role_focus:\s*["']?([^"'\s]+)["']?/);
      if (matchFeat && matchFeat[1] && matchFeat[1] !== "none") {
        return {
          id: matchFeat[1],
          source: "member.local.md",
          developer: matchDev ? matchDev[1] : "unknown",
          role: matchRole ? matchRole[1] : "implementer",
        };
      }
    } catch {
      // ignore
    }
  }

  // 2. Git 分支名自适应匹配
  try {
    const branch = execSync("git branch --show-current", {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();

    if (branch) {
      const branchMatch = branch.match(
        /^(?:feat|feature|fix)\/([a-zA-Z0-9_-]+)$/,
      );
      const candidateId = branchMatch ? branchMatch[1] : branch;
      const featDir = path.join(
        workspaceRoot,
        `.harness/features/${candidateId}`,
      );
      if (fs.existsSync(featDir)) {
        return {
          id: candidateId,
          source: `branch:${branch}`,
          developer: "git-user",
          role: "implementer",
        };
      }
    }
  } catch {
    // 非 git 环境忽略
  }

  // 3. feature_list.json 中进行中的特性
  const featureListPath = path.join(workspaceRoot, "feature_list.json");
  if (fs.existsSync(featureListPath)) {
    try {
      const listData = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
      const inProgress = listData.features?.filter(
        (f) => f.status === "in_progress",
      );
      if (inProgress && inProgress.length === 1) {
        return {
          id: inProgress[0].id,
          source: "feature_list.json",
          developer: "team",
          role: "implementer",
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    id: null,
    source: "global",
    developer: "team",
    role: "general",
  };
}

// 供 CLI 直接调用：node resolve-feature.mjs [--source]
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = resolveActiveFeature();
  if (process.argv.includes("--source")) {
    process.stdout.write(`${result.id || "none"}|${result.source}\n`);
  } else {
    process.stdout.write(result.id ? `${result.id}\n` : "");
  }
}
