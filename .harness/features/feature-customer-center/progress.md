# 客户中心特性进展记录 (Progress)

## 状态

- 状态: completed
- 启动时间: 2026-09-10
- 完成时间: 2026-09-10

## 阶段清单

- [x] 特性初始化、治理账本更新与沙盒构建（历史 P1/P2 未开始任务标记为“暂不实施”）
- [x] 搭建独立 Feature 包 `@chenrun/feature-customer-center` 与 Prisma Schema 内聚模型（表及字段全中文注释）
- [x] 实现领域服务与业务逻辑（客户唯一流水编码生成、客户停用级联停用门店、已有单据防删除保护、三级报价优先级算法：门店 > 客户 > 区域）
- [x] 注册受控功能权限，并升级左侧导航栏顶级手风琴【客户中心】
- [x] 实现租户端 4 张业务与基础设置页面（/customer/categories-tags、/customer/customers、/customer/stores、/customer/quotes）
- [x] 友好基础设施异常捕获视图（Docker/数据库断连智能提示与重试）
- [x] 自动化测试与全栈门禁验证（./scripts/verify.sh 全绿，13/13 包 check 通过）
- [x] 工业级数据迁移与命名规范统一重构：
  - [x] 数据库表名与字段名全量统一为小写下划线 `snake_case`（Prisma 保持 TypeScript 友好小驼峰通过 `@map` 映射）
  - [x] 平台控制库迁移与租户数据舰队迁移物理拆包为 `tooling/platform-migrate` 与 `tooling/tenant-migrate`
  - [x] 抽取公共迁移对比与哈希计算工具至 `@chenrun/shared`
  - [x] 实现动态 Feature Schema 扫描器（`schema-scanner`），自动聚合各业务包模型生成最新建表 DDL
  - [x] 新租户开通全量初始化与基线版本对齐（Baseline Alignment），彻底消除硬编码 SQL 字符串
  - [x] 控制平面 (`apps/control`) 新增可视化“数据架构与迁移中枢”页面与升级/回退操作交互
  - [x] 全栈门禁验证通过：14/14 packages 类型检查通过，136/136 单测全部 PASS，两端 Next.js 构建全部成功！
- [x] 公共 UI 模块规范化与客户中心全量重构：
  - [x] 对齐 shadcn/ui 官方原生规范（new-york 风格、React 19 签名、data-slot、CSS 变量设计令牌）并打通 Monorepo CLI 工作流（`pnpm ui:add` 与 SOP 沉淀）
  - [x] 引入 `next-themes` 与 `ThemeProvider`，在 `TopHeader` 顶栏装配分段胶囊 `ThemeToggle` 组件（亮色、暗色、跟随系统）
  - [x] 彻底根除暗色模式下的白边问题，在 `globals.css` 注入官方 `@layer base { * { @apply border-border outline-ring/50; } }`
  - [x] 客户中心 4 张页面全量接入 `@chenrun/ui`（`BusinessTableWorkspace` + `DictionarySectionCard` + `Tabs` + `Button` + `Input` + `Badge`）
  - [x] 彻底消除 `any` 逃逸，全面补齐 `CustomerListItem`、`StoreListItem`、`QuoteListItem` 强类型契约与完备中文注释
  - [x] 遵循 SuperJSON 官方规范注册 `Decimal.js`，通过 `@chenrun/shared` 的 `toPlainData` 彻底根治 Next.js RSC 跨界 Decimal 报错
  - [x] 升级 `@chenrun/shared` 全局底座，引入 `radash`、`dayjs`、`superjson` 并优化集合与格式化工具
