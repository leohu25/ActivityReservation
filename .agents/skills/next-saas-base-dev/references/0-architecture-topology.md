# 0. Monorepo 包拓扑与垂直切片规范 (Architecture Topology)

> **定位**：本文档专门定义全仓工程包物理边界、依赖流向铁律以及业务切片目录结构。

---

## 一、 顶层分层拓扑与单向依赖

```text
apps/control | apps/tenant                  [双端装配层]
          │
          ▼
packages/domains/* | packages/platform/*    [业务垂直切片层]
          │
          ▼
packages/biz-shared                         [业务中台通用资产 (@biz/shared)]
          │
          ▼
packages/base/*                             [平台核心基座 (@base/*)]
          │
          ▼
tooling/db-migrate                          [12-Factor 自愈迁移引擎]
```

### 单向依赖铁律：
1. **上层可依赖下层，下层严禁反向依赖上层**：
   - `@base/*` 绝对禁止依赖任何业务包（`@domain/*` 或 `@biz/*`）；
   - `@biz/*` 绝对禁止依赖上层业务切片；
2. **同级切片严禁横向直连**：
   - 严禁在 `@domain/a` 中通过相对路径引用 `@domain/b` 的私有代码；
   - 跨业务共享必须上浮至 `@biz/shared`。

---

## 二、 业务垂直切片目录物理边界

每个业务切片（`packages/domains/<domain>/`）按聚合根组织其内部目录：

```text
packages/domains/<domain>/
├── src/
│   ├── assembly/          # 租户 DB 上下文与切片 Catalog 组装层
│   ├── catalog.ts         # 切片权限目录派生 (SSoT)
│   ├── manifest.ts        # 切片自描述清单与推荐菜单大纲
│   ├── shared/            # 本切片内部跨 Feature 共享类型
│   └── features/          # 业务特性目录 (一级切片)
│       └── <feature>/
│           ├── contract.ts        # 权限契约与 URL 参数契约
│           ├── schema.ts          # Zod 校验规则与 DTO 推导
│           ├── types.ts           # 领域 ViewModel 与接口
│           ├── service.ts         # 领域服务核心逻辑
│           ├── queries.ts         # server-only 查询接口 (带 cache)
│           ├── actions.ts         # defineServerAction 直写写操作
│           ├── <sub-feature>/     # 【子切片】：从属子实体独立闭环 (仅限 1 层)
│           │   ├── contract.ts / schema.ts / types.ts
│           │   ├── service.ts / queries.ts / actions.ts
│           │   └── ui/
│           └── ui/                # 视图与表单组件
│               ├── <Feature>View.tsx
│               └── columns.tsx    # 列表列定义独立文件
```

---

## 三、 切片自治与依赖不变量 (Dependency Invariants)

1. **子切片最大嵌套深度硬约束（防目录深渊）**：
   - 子切片只允许存在于 `src/features/<feature>/<sub-feature>/`，**最大嵌套深度严格约束为 1 层**；
   - 严禁出现三层嵌套（如 `features/a/b/c/`）；若子切片进一步膨胀，必须平级提升为独立的一级 Feature；
2. **主向子严格单向依赖铁律（防循环死锁）**：
   - 主切片可在事务与页面中单向引用子切片的契约、类型与 Service；
   - **子切片绝对禁止反向引用主切片的私有实现**（Service / Actions / UI），确保子切片自治、纯粹且具备完全独立的单测覆盖；
3. **列表列物理独立**：`DataTable` 的 columns 必须独立抽离至同级 `columns.tsx`，与 View 视图物理解耦；
4. **单文件代码防巨石限制**：UI 单文件代码严格控制在 **50~180 行**，超过 200 行必须无条件进行物理拆解。
