#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const workspaceRoot = path.resolve(process.cwd());

const requiredBase = [
  "AGENTS.md",
  "feature_list.json",
  ".harness/memory/index.md",
  ".harness/context/tier-1-metadata.md",
  ".harness/context/tier-2-domain-matrix.md",
  ".harness/agents/index.md",
  ".harness/tools/policies.md",
];

let ok = true;
for (const rel of requiredBase) {
  const full = path.join(workspaceRoot, rel);
  if (!fs.existsSync(full)) {
    process.stderr.write(`[Bootstrap] 缺失关键治理文件: ${rel}\n`);
    ok = false;
  }
}

const featureListPath = path.join(workspaceRoot, "feature_list.json");
if (fs.existsSync(featureListPath)) {
  try {
    const featureList = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
    const features = Array.isArray(featureList.features)
      ? featureList.features
      : [];
    const featureIds = new Set(features.map((f) => f.id));
    if (featureIds.size !== features.length) {
      process.stderr.write(
        "[Bootstrap] feature_list.json 存在重复 Feature ID。\n",
      );
      ok = false;
    }
    for (const f of features) {
      const deps = f.dependencies ?? f.depends_on ?? [];
      const missing = deps.filter((d) => !featureIds.has(d));
      if (missing.length > 0) {
        process.stderr.write(
          `[Bootstrap] 特性 ${f.id} 存在未知依赖: ${missing.join(", ")}\n`,
        );
        ok = false;
      }
    }
  } catch (err) {
    process.stderr.write(
      `[Bootstrap] feature_list.json 解析失败: ${err.message}\n`,
    );
    ok = false;
  }
}

if (ok) {
  process.stdout.write("  • 治理基线: 核心规范与切片基线完备\n");
  process.exit(0);
} else {
  process.exit(1);
}
