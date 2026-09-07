# 特性背景：Monorepo 骨架与 Next.js 官方脚手架初始化 (foundation-monorepo)

## 一、 业务目标与需求背景

- 基于 pnpm workspace + Turborepo 搭建模块化单体 (Modular Monolith) 架构底座。
- 使用 Next.js 官方推荐脚手架初始化 `apps/tenant` 租户端应用（Next.js App Router + TypeScript + Tailwind CSS）。
- 初始化基础共享 packages 模块骨架（`packages/foundation`, `packages/db-control`, `packages/db-tenant`, `packages/ui`, `packages/shared`），打通依赖引用与编译验证。

## 二、 核心功能与交付物

- **根目录构建工作流**：配置 `pnpm-workspace.yaml`、`turbo.json` 与根目录 `package.json`。
- **租户端主应用**：使用 `create-next-app` 初始化 `apps/tenant`，符合官方推荐目录与 Tailwind 规范。
- **共享包骨架**：创建 `packages/*` 基础骨架，提供基础 tsconfig 与导出规范。
- **门禁打通**：`pnpm build` 与 `pnpm check` 成功执行。
