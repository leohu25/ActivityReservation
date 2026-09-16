import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { boundariesConfig } from "./eslint-boundaries.mjs";

import { architectureRedlineRules } from "./eslint-rules.mjs";

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
    rules: {
      ...architectureRedlineRules,
    },
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
  // 单元测试中豁免某些语法限制与类型限制
  {
    files: ["**/*.test.{js,jsx,ts,tsx,mjs}", "**/*.spec.{js,jsx,ts,tsx,mjs}"],
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "boundaries/element-types": "off",
      "react/no-children-prop": "off",
    },
  },
  // React 19 / Compiler 实验性规则兼容与调优
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // UI 库底层通用泛型组件豁免局部 any
  {
    files: ["packages/ui/**", "packages/shared/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
]);

export default eslintConfig;
