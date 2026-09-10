# 特性交接单: arch-infra-packages-refactor

## 1. 特性背景与目标

完成基础设施四大核心包（`packages/auth`, `packages/authorization`, `packages/db-control`, `packages/db-tenant`）内部物理子目录重构，剥离 `auth` 的 UI 依赖并下沉至 `tenant-admin`，并为四大核心包沉淀高规格 `README.md` 文档。

## 2. 完成状态与核心产出

- **完成状态**：100% 已完成 (Completed)
- **核心产出**：
  - `packages/db-control`: `contracts/`, `repositories/`, `prisma/` 分层与 `README.md`
  - `packages/db-tenant`: `pool/`, `migration/`, `topology/`, `seed/` 分层与 `README.md`
  - `packages/authorization`: `core/`, `scopes/`, `fields/`, `ability/`, `adapters/` 分层与 `README.md`
  - `packages/auth`: `server/`, `context/` 分层，剥离 `@chenrun/ui` 依赖，UI 组件下沉至 `tenant-admin/components/`，更新 `README.md`
  - 全仓类型检查与 139+ 单元测试 100% 通过，`./scripts/verify.sh` 全栈门禁绿灯。

## 3. 下一步指引

无残留阻塞，所有包外部接口保持 100% 向后兼容。
