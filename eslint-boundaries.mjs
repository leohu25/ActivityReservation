/**
 * @fileoverview Monorepo 模块架构拓扑与单向流依赖防御规则 (eslint-plugin-boundaries)
 *
 * 遵循架构分层规范：
 * apps/* -> packages/platform/* + packages/domains/* -> packages/base/* (platform-core / ui)
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
        type: "platform-suite",
        pattern: "packages/platform/*",
        mode: "folder",
      },
      {
        type: "domain",
        pattern: "packages/domains/*",
        mode: "folder",
      },
      {
        type: "platform-ui",
        pattern: "packages/base/ui",
        mode: "folder",
      },
      {
        type: "platform-core",
        pattern:
          "packages/base/(auth|authorization|biz-shared|db-control|db-tenant|shared)",
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
            allow: [
              "platform-suite",
              "domain",
              "platform-ui",
              "platform-core",
              "tooling",
            ],
          },
          // 2. 平台基础设施套件 (packages/platform/*)
          {
            from: "platform-suite",
            allow: ["platform-ui", "platform-core"],
          },
          // 3. 业务领域切片 (packages/domains/*) 允许消费平台基建，严禁领域切片间横向依赖与应用反向依赖
          {
            from: "domain",
            allow: ["platform-ui", "platform-core"],
          },
          // 4. UI 库 (@base/ui) 纯无头中立，严禁依赖业务领域、认证授权等具体逻辑
          {
            from: "platform-ui",
            allow: ["platform-core"],
          },
          // 5. 平台核心基建 (auth, db 等)
          {
            from: "platform-core",
            allow: ["platform-core", "tooling"],
          },
          // 6. 迁移与工程工具
          {
            from: "tooling",
            allow: ["platform-core"],
          },
          // 7. 治理脚本
          {
            from: "scripts",
            allow: [
              "platform-core",
              "tooling",
              "platform-suite",
              "domain",
              "app",
            ],
          },
        ],
      },
    ],
  },
};
