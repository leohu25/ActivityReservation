# 修改白名单与边界：Turborepo 拓扑流水线与 Next.js instrumentation 运行时自愈 (arch-turborepo-pipeline-and-app-instrumentation)

## 允许修改的文件与目录 (修改白名单)

- `turbo.json`
- `package.json`
- `apps/control/src/instrumentation.ts`
- `apps/control/package.json`
- `apps/tenant/package.json`
- `tooling/db-migrate/package.json`
- `tooling/db-migrate/src/**`
- `.vscode/launch.json`
- `docs/collaboration/scripts-reference.md`
- `feature_list.json`
- `.harness/features/arch-turborepo-pipeline-and-app-instrumentation/**`

## 附带修改与前置联动 (Spillover / 联动扩围)

- `README.md` # 根 README 引导说明与架构事实源同步
- `AGENTS.md` # 渐进式索引补充 scripts-reference.md
- `apps/tenant/README.md` # 租户端应用说明文档同步
- `apps/control/README.md` # 平台管控端说明文档同步
- 如需为 Turborepo 提供工作区内部 package 级构建任务，可在各 app 或 package 的 `package.json#scripts` 补充对应 task 名（如 `codegen`）。

## 严禁修改的内容 (受保护区域)

- 严禁修改业务切片内部逻辑与业务组件（`packages/features/**`）；
- 严禁破坏已有的四维权限契约与实体审计基线；
- 严禁影响已有的生产构建与 Docker 打包逻辑。

- `apps/control/AGENTS.md` # 1 file @ head，联动修改自动登记

- `apps/control/CLAUDE.md` # 1 file @ head，联动修改自动登记
