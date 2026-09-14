import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { boundariesConfig } from "./eslint-boundaries.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/.turbo/**",
    "**/next-env.d.ts",
  ]),
  // 全局架构红线与 Monorepo 单向流边界
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    ...boundariesConfig,
  },
  // Control 数据库客户端与平台管控免除 DATABASE_URL 限制
  {
    files: ["packages/db-control/**", "tooling/db-migrate/**"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // 租户/角色切换等特殊上下文免除 reload 限制
  {
    files: ["**/OrgSwitcher.tsx", "**/RolePermissionManager.tsx"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // 单元测试中豁免某些语法限制
  {
    files: ["**/*.test.{js,jsx,ts,tsx,mjs}", "**/*.spec.{js,jsx,ts,tsx,mjs}"],
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
