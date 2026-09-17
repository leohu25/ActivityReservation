#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROTECTED_ROOTS = [
  "tooling/db-migrate/migrations/",
  "tooling/db-migrate/baselines/",
];

export function normalizeGitPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

export function isProtectedMigrationArtifact(filePath) {
  const normalized = normalizeGitPath(filePath);
  return PROTECTED_ROOTS.some((root) => normalized.startsWith(root));
}

export function parseNameStatus(output) {
  if (!output.trim()) return [];

  return output
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [rawStatus, ...paths] = line.split("\t");
      const status = rawStatus[0];
      if (status === "R" || status === "C") {
        return {
          status,
          similarity: rawStatus.slice(1) || null,
          oldPath: normalizeGitPath(paths[0] ?? ""),
          path: normalizeGitPath(paths[1] ?? ""),
        };
      }
      return {
        status,
        similarity: null,
        oldPath: null,
        path: normalizeGitPath(paths[0] ?? ""),
      };
    });
}

export function findImmutableMigrationViolations(changes) {
  return changes.filter((change) => {
    if (change.status === "A" || change.status === "C") return false;
    return (
      isProtectedMigrationArtifact(change.path) ||
      (change.oldPath !== null && isProtectedMigrationArtifact(change.oldPath))
    );
  });
}

export function formatViolation(change) {
  if (change.status === "R" || change.status === "C") {
    return `${change.status}${change.similarity ?? ""} ${change.oldPath} -> ${change.path}`;
  }
  return `${change.status} ${change.path}`;
}

function hasGitHead(workspaceRoot) {
  try {
    execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: workspaceRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function getStagedMigrationChanges(workspaceRoot) {
  if (!hasGitHead(workspaceRoot)) return [];
  const output = execFileSync(
    "git",
    [
      "diff",
      "--cached",
      "--name-status",
      "-M",
      "HEAD",
      "--",
      "tooling/db-migrate/migrations",
      "tooling/db-migrate/baselines",
    ],
    {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return parseNameStatus(output);
}

export function runMigrationImmutabilityCheck(workspaceRoot = process.cwd()) {
  return findImmutableMigrationViolations(
    getStagedMigrationChanges(workspaceRoot),
  );
}

function findWorkspaceRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (current !== path.dirname(current)) {
    try {
      execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: current,
        stdio: "ignore",
      });
      return execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: current,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      current = path.dirname(current);
    }
  }
  return path.resolve(startDir);
}

let isDirectRun = false;
try {
  if (process.argv[1]) {
    isDirectRun =
      path.resolve(process.argv[1]) ===
      path.resolve(fileURLToPath(import.meta.url));
  }
} catch {
  isDirectRun = false;
}

export function isMigrationBaselineResetAllowed(env = process.env) {
  return (
    env.ALLOW_MIGRATION_BASELINE_RESET === "1" ||
    env.ALLOW_MIGRATION_BASELINE_RESET === "true"
  );
}

if (isDirectRun) {
  if (isMigrationBaselineResetAllowed()) {
    process.stdout.write(
      "\x1b[33m• 迁移历史不可变门禁: 检测到 ALLOW_MIGRATION_BASELINE_RESET，受控放行基线重置\x1b[0m\n",
    );
    process.exit(0);
  }

  const violations = runMigrationImmutabilityCheck(findWorkspaceRoot());
  if (violations.length > 0) {
    process.stderr.write(
      `\x1b[31m✗ [迁移历史不可变门禁] 检测到 ${violations.length} 个已提交迁移/基线工件被修改、删除或重命名。\x1b[0m\n`,
    );
    for (const violation of violations) {
      process.stderr.write(
        `  \x1b[33m• ${formatViolation(violation)}\x1b[0m\n`,
      );
    }
    process.stderr.write(
      "\n迁移历史必须 Append-Only：请还原上述文件，并通过新增迁移修复数据库结构。\n" +
        "基线重置属于全库重建操作，不能通过普通提交绕过；如确需执行，应先建立独立的受控重置流程。\n",
    );
    process.exit(1);
  }

  process.stdout.write(
    "\x1b[32m• 迁移历史不可变门禁: 已提交迁移与基线保持 Append-Only\x1b[0m\n",
  );
}
