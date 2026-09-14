import boundaries from "eslint-plugin-boundaries";
import { architectureRedlineRules } from "./eslint-rules.mjs";

/**
 * 架构边界与 Monorepo 依赖流向 ESLint 插件配置
 * 用于在编辑器层面实时阻断跨切片横向调用与底层反向依赖上层
 */
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
        pattern: [
          "packages/auth",
          "packages/authorization",
          "packages/db-tenant",
          "packages/db-control",
        ],
        mode: "folder",
      },
      {
        type: "platform-foundation",
        pattern: ["packages/shared", "packages/biz-shared"],
        mode: "folder",
      },
      {
        type: "tooling",
        pattern: "tooling/*",
        mode: "folder",
      },
    ],
  },
  rules: {
    ...architectureRedlineRules,
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          // 1. 应用装配层 (apps/*)：允许编排业务切片与所有平台基础设施
          {
            from: "app",
            allow: [
              "feature",
              "platform-ui",
              "platform-core",
              "platform-foundation",
              "tooling",
            ],
          },
          // 2. 业务切片 (packages/features/*)：只能依赖平台基础设施，严禁 Feature 依赖 Feature
          {
            from: "feature",
            allow: ["platform-ui", "platform-core", "platform-foundation"],
          },
          // 3. UI 视觉地基 (packages/ui)：处于纯视觉层，只允许依赖 shared 基础类型与工具，严禁依赖业务切片、auth 或 db
          {
            from: "platform-ui",
            allow: ["platform-foundation"],
          },
          // 4. 平台核心层 (auth, authorization, db-tenant, db-control)：只能依赖纯底层契约，严禁依赖 UI 与业务切片
          {
            from: "platform-core",
            allow: ["platform-foundation", "platform-core"],
          },
          // 5. 纯契约与工具基础库 (shared, biz-shared)：最底层，严禁依赖任何外部工作区模块
          {
            from: "platform-foundation",
            allow: ["platform-foundation"],
          },
        ],
      },
    ],
  },
};
