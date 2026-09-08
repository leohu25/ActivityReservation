# 换手交接单：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 状态总览

- 当前状态: READY TO START (已准备就绪，作为当前会话首选开工特性)
- 负责人: @coordinator -> @implementer
- 前置依赖: `procurement-center` (已就绪)

## 关键交接事项与注意事项

1. 重构 `EmployeeProfile` 时将 `memberId` 变为可空逻辑引用，不要破坏已有的 `resolveEmployeeTopology`。
2. 确保在 `tooling/tenant-migrate` 中生成的 Migration 语法安全且符合 PostgreSQL DDL 规范。
