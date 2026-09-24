# 特性开发进度 — feat-central-kitchen-production-resources

## 实施阶段进度记录

- [x] 1. 契约与 Schema 设计 (contract.ts, schema.ts, types.ts 覆盖工序与工艺规格双层结构)
- [x] 2. 服务层与事务编排 (OperationService + ProcessingSpecificationService：子切片自治、增量比对同步、出成率换算、防重校验与软删除)
- [x] 3. 服务端查询与变更操作 (queries.ts, actions.ts 使用 defineServerAction 包装与字段权限校验)
- [x] 4. UI 界面开发 (OperationListView 外列表 + OperationFormPage 主子表单：上半部分技术信息 + 下半部分工艺规格明细表)
- [x] 5. App Router 路由装配与导航联动 (apps/tenant/src/app/(dashboard)/(domains)/production/operations/**)
- [x] 6. 单元测试与门禁自检 (单测 17/17 全部通过、类型检查 0 错误、垂直切片门禁通过)
- [x] 7. 架构规范演进升级 (在 SKILL.md、0-architecture-topology.md、9-crud-resource-paradigm.md 沉淀三级递进架构模型，并在 check-vertical-slices.mjs 固化防巨石与子切片单向依赖门禁)
