---
name: erp-feature-dev
description: 辰润 ERP 业务切片全生命周期工程开发指南。涵盖数据建模、页面纯数据契约、领域服务、defineServerAction + CASL 写路径守卫、官方 CASL 客户端范式（layout AbilityProvider + useAbility）、工业风 UI、租户路由与 Manifest 对齐测试。按阶段 Schedule 推进并渐进式按需读取子文档。
color: blue
emoji: 🚀
vibe: 架构标准化、契约即事实源、底层机制防错、无感响应
agent_created: true
---

# 辰润 ERP 业务切片开发规范与生命周期指南 (ERP Feature Dev)

本项目采用 **FDD (Feature-Driven Development) 垂直切片架构**。
每个业务切片（`packages/features/<feature-name>`）都是高内聚、自包含的领域模块。

本规范以 `customer-center`（客户中心）为全栈工程标杆。本文件仅作为**高维索引、开发排期 (Schedule) 与绝对红线地图**，具体开发阶段的深度细节请**按需渐进式调阅 `references/` 子文档**。

---

## 六大工程红线 (Zero-Tolerance Rules)

1. **契约即唯一事实源**：每个页面必须在 `src/contracts/<page>.contract.ts` 维护专属纯数据契约，严禁手写平铺的 permissions 平行世界；页面 hide/不渲染的按钮必须同步从契约 `actions` 移除；
2. **底层机制消灭序列化异常**：所有 Server Actions 必须由 `defineServerAction` 包装，严禁原始 Prisma 实体（带 Decimal/Date）直出；
3. **交互单次确认**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 提示一次，严禁调用浏览器原生 `confirm(...)`；
4. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有操作反馈统一使用右上角 `toast`；
5. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更由 React 本地 State 驱动即时响应，搭配 `router?.refresh()` 静默同步；
6. **物理隔离路由**：业务数据必须由 `getTenant*Context()` 动态路由至租户独立库，严禁硬编码或跨租户穿透。
7. **一体化卡片容器**：列表页必须用 `DataTable.Root` 白卡整合标题/筛选/表格/分页，严禁零散漂浮在页面底色上（详见 `references/5-ui-components.md`）。
8. **写路径强制 CASL**：Server Action 写/删/状态变更必须 `assert*Ability(ability, action, subject)`，与页面按钮同一动作名（详见 `references/4-server-actions.md`）。
9. **BA 只管进门**：Better Auth 仅负责登录/会话/组织成员；业务权限只认 CASL（ADR-007），禁止用 BA `hasPermission` 查业务资源。
10. **客户端权限 = 官方 AbilityProvider（教科书）**：RSC layout 拉快照 → `TenantAbilityProvider` 注入 → View 只 `useAbility()`/积木；**禁止** View 自建 plain ability、禁止把 `permissions` 传进 View/Workspace（详见 `references/7-casl-ability-provider.md`，标杆 `customer-center`）。
11. **列表优先 shadcn**：简单列表/表单直接用 `Table`/`Form`/`Dialog`；需要统一工具栏时再用 `DataTable.Workspace`（可选加速，非强制）。
12. **表单优先 shadcn Form**：短表单直接 `Form`+`Field`；长表单/AI 批量字段可用 `FormFields` Schema（可选）。
13. **导出走契约**：CSV 导出用 `exportContractCsv(rows, contract.configurableFields, ...)`，禁止手写 fieldKeys。
14. **原子层 = shadcn 目录**：`packages/ui/.../shadcn/` 仅允许 `npx shadcn@latest add` 引入；禁止手写；业务不得裸写控件样式。

---

## 业务切片标准目录拓扑（宏观 FDD 垂直切片 + 微观 DDD 聚合根）

```bash
packages/features/<feature-name>/
├── prisma/
│   └── schema.prisma                  # 切片专属数据模型
├── src/
│   ├── contracts/                     # 页面纯数据契约 (SSoT)
│   │   ├── <page>.contract.ts         # 专属契约 (实体符号 + 字段枚举 + 页面契约)
│   │   └── index.ts                   # 契约聚合
│   ├── catalog.ts                     # derivePermissionCatalog([manifest]) 切片权限目录
│   ├── server/
│   │   └── session.ts                 # 租户上下文 + Ability 注入 + assert*Ability
│   ├── services/
│   │   └── <domain>.service.ts        # 领域纯业务服务 (防腐/单调递增/级联校验)
│   ├── actions.ts                     # defineServerAction + CASL 守卫
│   ├── components/                    # 专属业务交互组件（按微观 DDD 聚合根划分目录）
│   │   ├── <entity-a>/                # 📂 业务聚合根 A（如 customers/）
│   │   │   ├── <Page>View.tsx         # 列表工作台页面主视图
│   │   │   ├── <entity-a>-schema.ts   # 字段 Schema（增/改/查共用定义）
│   │   │   └── components/            # 仅当前实体专属的子组件/弹框
│   │   ├── <entity-b>/                # 📂 业务聚合根 B（如 quotes/）
│   │   │   ├── <Page>View.tsx
│   │   │   └── ...
│   │   ├── shared/                    # 📂 切片内部私有共享（仅当前 Feature 内部复用）
│   │   │   └── <Slice>AbilityBoundary.tsx # 官方 CASL：快照编译 + TenantAbilityProvider
│   │   └── index.ts                   # 统一导出所有主视图与组件
│   ├── manifest.ts                    # 切片自描述清单 (导航 + permissionModules 组装契约)
│   ├── types.ts                       # 领域数据传输对象与展示接口
│   └── index.ts                       # 切片外部公共导出
```

---

## Feature 开发流水线 (Standard Schedule)

开工开发或重构一个业务 Feature 时，严格按以下 **7 个阶段** 循序渐进：

```
Phase 1: 数据建模与物理隔离
         ↓
Phase 2: 纯数据契约 (SSoT)
         ↓
Phase 3: 领域服务层实现
         ↓
Phase 4: 安全 Actions 与序列化
         ↓
Phase 5: 工业风页面交互
         ↓
Phase 6: 租户端路由与 Manifest
         ↓
Phase 7: 契约对齐单测与全栈验证
```

### 阶段排期总表与渐进式调阅索引

| 阶段 | 核心任务 | 交付物与验证指标 | 深入阅读文档 |
| :--- | :--- | :--- | :--- |
| **Phase 1<br>数据建模** | 切片内定义模型，统一由 db-tenant 聚合生成 Client，运行基线迁移。 | • `prisma/schema.prisma`<br>• `pnpm migrate:tenant:gen` | `references/2-schema-migrate.md` |
| **Phase 2<br>纯数据契约** | 编写无 JSX、无 DOM 的纯数据契约，定义受控字段枚举与操作权限。 | • `src/contracts/<page>.contract.ts`<br>• 字段与动作自包含 | `references/1-contracts.md` |
| **Phase 3<br>领域服务** | 封装核心业务、自增编码算法、状态机级联与删除业务防护。 | • `src/services/<domain>.service.ts`<br>• 业务单测通过 | `references/3-services.md` |
| **Phase 4<br>安全 Actions** | 使用 `defineServerAction` 包装所有 Actions，彻底消除序列化异常与样板代码。 | • `src/actions.ts`<br>• 100% 自动 `toPlainData` | `references/4-server-actions.md` |
| **Phase 5<br>工业风交互** | 基于 `@chenrun/ui` 构建；官方 CASL Provider（layout 注入）+ `useAbility`/积木；单次确认、Toast、零白屏。 | • `src/components/<Page>View.tsx`（无 permissions props）<br>• 零 `window.location.reload` | `references/5-ui-components.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 6<br>路由与清单** | 租户端 `layout.tsx` 挂 `*AbilityBoundary`；page 只取业务数据；`manifest.ts` 暴露导航。 | • `apps/tenant/.../<slice>/layout.tsx`<br>• `src/manifest.ts` | `references/6-tenant-routing.md`<br>`references/7-casl-ability-provider.md` |
| **Phase 7<br>对齐单测** | 编写页面与契约 100% 对齐自动化单测，执行全栈门禁验证。 | • `<Page>View.test.tsx`<br>• `pnpm check` & `pnpm test` 全绿 | `references/6-tenant-routing.md` |
