---
name: erp-feature-dev
description: 辰润 ERP 业务切片全生命周期工程开发指南。涵盖数据建模迁移、页面纯数据契约 (contracts/)、领域服务实现、defineServerAction 序列化机制、工业风 UI 交互 (DataTable/Toast/单次确认/无感更新)、租户路由与 Manifest 对齐测试。按阶段 Schedule 推进并渐进式按需读取对应子文档。
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

1. **契约即唯一事实源**：每个页面必须在 `src/contracts/<page>.contract.ts` 维护专属纯数据契约，严禁手写平铺的 permissions 平行世界；
2. **底层机制消灭序列化异常**：所有 Server Actions 必须由 `defineServerAction` 包装，严禁原始 Prisma 实体（带 Decimal/Date）直出；
3. **交互单次确认**：破坏性操作统一由 `DataTableRowActions` 的 `ConfirmDialog` 提示一次，严禁调用浏览器原生 `confirm(...)`；
4. **消息通知右上角 Toast 弹出**：严禁在页面顶部塞入静态红色大横幅挤压变形表格布局，所有操作反馈统一使用右上角 `toast`；
5. **杜绝全页强刷**：严禁调用 `window.location.reload()`，状态变更由 React 本地 State 驱动即时响应，搭配 `router?.refresh()` 静默同步；
6. **物理隔离路由**：业务数据必须由 `getTenantCustomerContext()` 动态路由至租户独立库，严禁硬编码或跨租户穿透。
7. **一体化卡片容器**：列表页必须用 `DataTable.Root` 白卡整合标题/筛选/表格/分页，严禁零散漂浮在页面底色上（详见 `references/5-ui-components.md`）。

---

## 业务切片标准标准目录拓扑

```bash
packages/features/<feature-name>/
├── prisma/
│   └── schema.prisma                  # 切片专属数据模型
├── src/
│   ├── contracts/                     # 页面纯数据契约 (SSoT)
│   │   ├── <page>.contract.ts         # 专属契约 (实体符号 + 字段枚举 + 页面契约)
│   │   └── index.ts                   # 契约聚合
│   ├── db/
│   │   └── client.ts                  # 切片专属 PrismaClient 实例与连接池
│   ├── server/
│   │   └── session.ts                 # 租户上下文解析与准入门禁
│   ├── services/
│   │   └── <domain>.service.ts        # 领域纯业务服务 (防腐/单调递增/级联校验)
│   ├── actions.ts                     # defineServerAction 导出的安全 Actions
│   ├── components/
│   │   ├── <Page>View.tsx             # 工业风页面组件 (DataTable/Toast/单次确认)
│   │   └── <Page>View.test.tsx        # 页面与契约 100% 对齐自动化单测
│   ├── manifest.ts                    # 切片自描述清单 (导航菜单与权限模块定义)
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
| **Phase 5<br>工业风交互** | 基于 `@chenrun/ui` 构建，单次对话框确认、Toast 右上角通知、React State 零白屏响应。 | • `src/components/<Page>View.tsx`<br>• 零 `window.location.reload` | `references/5-ui-components.md` |
| **Phase 6<br>路由与清单** | 租户端挂载 RSC 页面，切片根目录配置 `manifest.ts` 暴露自描述导航。 | • `apps/tenant/src/app/...`<br>• `src/manifest.ts` | `references/6-tenant-routing.md` |
| **Phase 7<br>对齐单测** | 编写页面与契约 100% 对齐自动化单测，执行全栈门禁验证。 | • `<Page>View.test.tsx`<br>• `pnpm check` & `pnpm test` 全绿 | `references/6-tenant-routing.md` |
