# 避坑指南与工程实践总索引 (Learnings Index)

> **渐进式披露原则 (Progressive Disclosure)**：  
> 本目录收录全仓在业务切片演进、权限闭环、UI 交互、数据库分库与工程治理中踩过的关键坑位与核心实践。  
> **严禁一股脑读取全量文档**！在执行具体任务或排查特定问题时，请查阅下方 **【场景检索路由表】**，仅精准加载对应领域的小文件。

---

## 场景检索路由表 (Quick Routing Table)

根据您当前正在进行的开发任务或遇到的问题现象，按需检索并加载对应文档：

| 当前工作场景 / 遇到问题现象 | 推荐精准查阅的领域文档 | 涵盖的核心关键点 |
| :--- | :--- | :--- |
| **开发或修改功能权限、CASL 鉴权、工作台多实体权限配置、字段隐藏/只读失效** | [`permissions-and-casl.md`](./permissions-and-casl.md) | 契约 SSoT、实体键 vs 视图键双正交解耦、多实体非排他投射、FormModal 字段三态闭环、下拉选项防级联瘫痪、反假强类型 |
| **编写或调试 UI 页面、安装 shadcn 组件、DataTable 列表、TabBar 页签、暗色模式排查** | [`ui-and-components.md`](./ui-and-components.md) | shadcn 安装 SOP、DataTable 复合积木、软导航 vs 硬导航、暗色设计令牌、DataTableRowActions 详情显隐、多实体页面禁止并排 |
| **修改 Prisma 模型、多租户数据库连接池、运行迁移引擎、数据库基线漂移自愈** | [`database-and-multitenant.md`](./database-and-multitenant.md) | TenantDbManager LRU 连接池、@base/db-migrate 12-Factor 自愈引擎、Baseline SQL 与 Advisory Lock、Turbopack 缓存清理 |
| **编写 Server Component、Server Actions、跨端数据传输 (toPlainData)、序列化报错** | [`nextjs-and-server-actions.md`](./nextjs-and-server-actions.md) | RSC 直调 Service（禁伪 API）、Server Action 变动适配器、Prisma Decimal/Date 纯数据清洗（toPlainData）、官方配方优先 |
| **编写或修改构建脚本、Git 门禁拦截、进度记录与交接单维护** | [`engineering-and-scripts.md`](./engineering-and-scripts.md) | 跨平台 Node.js (*.mjs) 强制规范、Git pre-commit 兜底、单源特性状态治理（消除状态双写） |
| **常量定义、TypeScript 类型报错、代码重构与消除 any 坏味道** | [`architecture-and-types.md`](./architecture-and-types.md) | 彻底消灭 TS 原生 enum、坚守 `as const` 现代字面量范式、强制全链路强类型与零 any 防线 |

---

## 领域知识库结构

```text
.harness/memory/learnings/
├── index.md                     # 本总索引（场景检索与渐进式披露导航）
├── permissions-and-casl.md      # 权限定义、CASL 四层闭环、契约 SSoT、工作台双正交权限
├── ui-and-components.md         # UI 工业风规范、DataTable、TabBar、暗色模式设计令牌
├── database-and-multitenant.md  # TenantDbManager、12-Factor 自愈迁移引擎、Baseline
├── nextjs-and-server-actions.md # App Router RSC、Server Actions、toPlainData 序列化防线
├── engineering-and-scripts.md   # Node.js 治理脚本、单一事实源、Git pre-commit 兜底
└── architecture-and-types.md    # 全仓 as const 规范、强类型端到端推导、零 any 防线
```
