/**
 * @fileoverview Monorepo 模块架构拓扑与单向流依赖防御规则 (eslint-plugin-boundaries)
 *
 * 遵循架构分层规范：
 * apps/* -> packages/features/* -> packages/* (platform-core / ui)
 */

import boundaries from "eslint-plugin-boundaries";

export const boundariesConfig = {
  plugins: {
    boundaries,
  },
  settings: {
    "boundaries/elements": [
      {
        type: "app",
        pattern: "apps/*",
        mode: "folder",
      },
      {
        type: "feature",
        pattern: "packages/features/*",
        mode: "folder",
      },
      {
        type: "platform-ui",
        pattern: "packages/ui",
        mode: "folder",
      },
      {
        type: "platform-core",
        pattern:
          "packages/(auth|authorization|biz-shared|db-control|db-tenant|shared)",
        mode: "folder",
      },
      {
        type: "tooling",
        pattern: "tooling/*",
        mode: "folder",
      },
      {
        type: "scripts",
        pattern: "scripts/*",
        mode: "folder",
      },
    ],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          // 1. 应用装配层 (apps/*) 拥有最高装配权限
          {
            from: "app",
            allow: ["feature", "platform-ui", "platform-core", "tooling"],
          },
          // 2. 业务切片 (packages/features/*) 允许消费平台基建，严禁切片间横向依赖与应用反向依赖
          {
            from: "feature",
            allow: ["platform-ui", "platform-core"],
          },
          // 3. UI 库 (@base/ui) 纯无头中立，严禁依赖业务切片、认证授权等具体逻辑
          {
            from: "platform-ui",
            allow: ["platform-core"],
          },
          // 4. 平台核心基建 (auth, db 等)
          {
            from: "platform-core",
            allow: ["platform-core", "tooling"],
          },
          // 5. 迁移与工程工具
          {
            from: "tooling",
            allow: ["platform-core"],
          },
          // 6. 治理脚本
          {
            from: "scripts",
            allow: ["platform-core", "tooling", "feature", "app"],
          },
        ],
      },
    ],
  },
};
