# 9. 标准资源 CRUD 交付流水线 (Standard Resource CRUD Pipeline)

> **定位**：本文档定义全仓通用的标准资源端到端 8 步交付流水线（SOP）。  
> 帮助开发者与 AI 快速完成一个标准的切片 CRUD 闭环，杜绝流程遗漏。

---

## 一、 交付流水线总览 (SOP Map)

```text
① contract.ts   CASL 权限契约与 defineListSearchParams URL 契约
② schema.ts     共享 Zod 校验规则与强类型推导
③ service.ts    领域服务逻辑（Prisma 事务 / 审计落盘 / 状态机）
④ queries.ts    server-only 读接口与 React cache() 记忆化
⑤ actions.ts    defineServerAction 直写平铺写操作网关
⑥ columns.tsx   独立列表受控列定义与 DataTableRowActions
⑦ UI View/Page  列表视图与表单单据装配（遵循双轨选型）
⑧ 测试与门禁    编写单测，通过 pnpm verify 门禁验证
```

---

## 二、 阶段详细实施规范

### 第一步：契约层 (`contract.ts`)
- 定义 Subject 标识、Action 动作枚举、Field 字段枚举；
- 使用 `defineListSearchParams` 声明列表 URL 查询参数默认值；
- 导出 `PageContract` 供切片 Manifest 消费。

### 第二步：校验层 (`schema.ts`)
- 基于 Zod 编写 `createSchema`、`updateSchema`、`listQuerySchema`；
- 使用 `z.infer<...>` 导出强类型 Input DTO。

### 第三步：服务层 (`service.ts`)
- 编写纯静态 Service 类（如 `ResourceService`）；
- 核心增删改必须跑在事务内；
- 写入与修改严格落实 ADR-009 审计字段（`createdById`, `deptId`, `updatedById`）；
- 删除统一采用软删除（`isDeleted: true`, `deletedAt`, `deletedById`）。

### 第四步：读网关 (`queries.ts`)
- 必须标明 `"server-only"`；
- 统一消费租户上下文；
- 读查询必须挂载 `accessibleWhere` 自动下推 CASL 数据范围过滤；
- 内部使用 React `cache()` 进行单请求记忆化。

### 第五步：写网关 (`actions.ts`)
- 标明 `"use server"`；
- 统一使用 `defineServerAction(...)` 平铺直写导出；
- 执行前断言 `assertAbility(ability, action, subject)`；
- 成功后调用 `revalidatePath(...)` 精准自愈缓存。

### 第六步：列表列 (`columns.tsx`)
- 独立抽离至 `columns.tsx` 文件；
- 统一使用 `ColumnDef<TData>`；
- 操作列统一使用 `<DataTableRowActions />`。

### 第七步：UI 视图与页面装配 (`ui/` & `page.tsx`)
- **列表视图 (`ui/ResourceView.tsx`)**：
  - 使用 `useListSearch(resourceSearchParams)`；
  - 渲染一体化 `<DataTable />`（传入 `subject` 自动接管权限）。
- **表单与单据形态**：
  - 严格遵循双轨策略（80% 选 `FormModal` / `FormPage`，20% 选 `<DocumentShell>` 积木拼装）。
- **页面装配 (`apps/tenant/.../page.tsx`)**：
  - 标准异步 Server Component；
  - 并发执行 `listQuery` 与 `pageOptionsQuery` 并直通渲染客户端视图。

### 第八步：自动化单测与门禁自检
- 在切片同级编写 `contract.test.ts`、`schema.test.ts`、`service.test.ts`；
- 提交前运行 `node scripts/verify.mjs`，确保 15 项物理门禁一次性全绿。
