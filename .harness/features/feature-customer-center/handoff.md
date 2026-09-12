# 客户中心与迁移架构重构会话交接 (Session Handoff)

## 当前上下文

- 已完成客户中心（`feature-customer-center`）垂直切片闭环；
- 已完成工业级多租户数据迁移架构重构与物理数据库 `snake_case` 命名统一。

## 已完成事项

1. **客户中心业务切片与 UI 架构重构**:
   - 独立包 `@base/feature-customer-center` 与内聚 Prisma Schema（所有表与字段全中文注释）；
   - 客户档案（自动流水编码、停用级联停用门店、防物理删除保护）；
   - 门店档案（强制绑定区域编码，三级报价优先级匹配：门店 > 客户 > 区域）；
   - 分类与标签设置（防环多级分类树、标签字典）；
   - 门店报价单（生命周期状态机、明细条目管理）；
   - 客户中心 4 张页面全量接入 `@base/ui`（`BusinessTableWorkspace` + `DictionarySectionCard` + `Tabs` + `Button` + `Input` + `Badge`）；
   - 消除全包 `any` 逃逸，补全强类型模型与详尽中文 JSDoc 注释；
   - 遵循 SuperJSON 官方规范注册 `Decimal.js`，通过 `@base/shared` 的 `toPlainData` 彻底消除 RSC 跨界 Decimal 报错；
2. **多租户数据迁移架构与命名重构**:
   - 物理数据库表名与字段名全量统一为小写下划线 `snake_case`；
   - 物理拆分平台迁移 `tooling/platform-migrate` 与租户舰队迁移 `tooling/tenant-migrate`；
   - 抽取公共迁移算法至 `@base/shared`；
   - 落地新租户动态全量 Schema 扫描初始化与基线版本对齐（Baseline Alignment），彻底拔除写死 SQL；
   - 控制平面提供 `/migrations` 可视化数据架构与迁移中枢看板；
3. **全局工具底座与设计系统升级**:
   - 官方化 shadcn/ui 组件库，打通 `pnpm ui:add` Monorepo CLI 工作流并在 `.harness/memory/learnings.md` 沉淀 SOP；
   - 引入 `next-themes` 与分段微胶囊 `ThemeToggle` 组件（支持亮色、暗色、跟随系统）；
   - 在 `globals.css` 注入官方 `@layer base`，彻底根治暗色高反差白边；
   - 在 `@base/shared` 引入 `radash`、`dayjs`、`superjson` 并优化集合与格式化工具；
4. **门禁与测试**:
   - 14/14 packages 类型检查 0 错误；
   - 33/33 核心单元测试 100% 通过；
   - 两端 Next.js 生产编译成功；
   - 门禁 `./scripts/verify.sh` 全绿。

## 待办与建议 (Next Steps)

- 启动本地开发服务验证前端交互：`pnpm dev:control` (3001) 与 `pnpm dev:tenant` (3000)；
- 继续规划下一个业务中心特性（如物料商品中心、供应链与采购增强等）。
