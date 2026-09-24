# references 规范技术大纲与调度总览

> **核心原则**：
> 1. **单一职责 (Single Responsibility)**：每一个文档只专注于自身一个独立领域的技术标准，同级文档之间**零互相引用与零横向耦合**；
> 2. **顶层单向调度 (Top-down Orchestration)**：本文件与根 `SKILL.md` 是全仓唯一的导航调度中枢。后续任何演进，仅需维护“目标文档本身 + 本地图对应条目”。

---

## 一、 规范全景矩阵

| 序号 | 规范文档 | 单一职责说明 (Single Source of Truth) | 适用研发场景 |
| :--- | :--- | :--- | :--- |
| **0** | [`0-architecture-topology.md`](./0-architecture-topology.md) | Monorepo 依赖流向、切片物理嵌套规则（≤1层）、主向子单向依赖 | 切片分包、新建目录、依赖解耦 |
| **1** | [`1-contracts.md`](./1-contracts.md) | CASL 权限契约（Subject/Action/Field）与 `defineListSearchParams` URL 契约 | 契约制定、URL 参数绑定 |
| **2** | [`2-schema-migrate.md`](./2-schema-migrate.md) | Prisma 实体建模、8大审计基线、12-Factor 自愈迁移与老表加字段铁律 | 数据库设计、执行迁移升级 |
| **3** | [`3-services.md`](./3-services.md) | 领域 Service 事务、`server-only` 查询接口、React `cache()` 与 DTO 脱敏 | 业务逻辑、读查询开发 |
| **4** | [`4-server-actions.md`](./4-server-actions.md) | `defineServerAction` 强类型包装、`toPlainData` 序列化与异常安全 | 写操作 Mutation 网关开发 |
| **5** | [`5-ui-components.md`](./5-ui-components.md) | 一体化 `DataTable` 标准列表、`TreeFilter` 受控树形导航与交互反馈 | 列表视图、左树右表布局开发 |
| **6** | [`6-tenant-routing.md`](./6-tenant-routing.md) | 双端 RSC 页面直通装配、专属 `AbilityBoundary` 边界与切片 Manifest | 路由开通、动态菜单注册 |
| **7** | [`7-casl-ability-provider.md`](./7-casl-ability-provider.md) | CASL 鉴权引擎核心、`TenantAbilityProvider` 注入与 SQL 自动下推 | 权限闭环调试、数据范围控制 |
| **8** | [`8-base-infrastructure.md`](./8-base-infrastructure.md) | `@base/*` 基础设施边界、演进原则与跨项目绝对业务中立性 | 底座重构、通用组件沉淀 |
| **9** | [`9-crud-resource-paradigm.md`](./9-crud-resource-paradigm.md) | **标准资源 CRUD 端到端 8 步交付流水线（通用 SOP 流程）** | 新特性快速开发闭环 |
| **10** | [`10-storage-and-attachments.md`](./10-storage-and-attachments.md) | S3 对象存储、预签名安全上传、图片缩放与多态附件标准模型 | 文件上传、图片附件业务 |
| **11** | [`11-dual-track-form-document-paradigm.md`](./11-dual-track-form-document-paradigm.md) | **单据与表单双轨开发标准指南（选型树 / DocumentShell / 积木拼装 / 只读穿透）** | 表单开发、复杂单据工作台拼装 |

---

## 二、 现行作废清单（新代码禁止使用）

为杜绝历史包袱，以下过时 API 与模式**绝对禁止在新代码中使用**（门禁脚本自动拦截）：

- ❌ 严禁用 `any`、`(x as any)` 恶性降解类型；
- ❌ 严禁使用过时的列表状态 API：`useTableUrlState`、`parseTableSearchParams`、`useDataTableState`、`useListUrlNav`；
- ❌ 严禁业务层手绘表壳或手写裸 input/div：`ListShell`、`TableRegion`、手写原生 `<table>`；
- ❌ 严禁客户端默认 `router.refresh()` 或 `window.location.reload()`；
- ❌ 严禁单开 `@base/crud` 包，统一按职责归入 `@base/ui` 或 `@biz/shared`；
- ❌ 严禁过度包装工厂模式：`createResourcePage`、`createResourceActions`、`createResourceList`。
