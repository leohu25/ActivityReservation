# 特性交接备忘录 (Handoff) — arch-eliminate-search-dsl-and-adopt-prisma-native-relations

## 一、 特性交付摘要

本特性彻底解决了系统内部自造搜索 DSL（`SearchContract` 与 `executeSearchContract` 动态反射）导致的强转 `as unknown as Record`、代码难以被 AI 准确识别与维护、以及数据库物理外键死锁隐患。通过全面落地 Prisma 官方 **`relationMode = "prisma"`** 与 **范式 A 嵌套关系过滤**，达成了：

1. **数据库物理外键 100% 清零**：生成的全新租户迁移 `20260917020253_drop_all_foreign_keys_and_use_logical_relations` 一次性 DROP 掉数据库中全部 29 个物理外键约束，彻底免疫物理外键并发死锁；
2. **纯逻辑强类型关系感知**：Prisma Client 拥有清晰的强类型 `customer`、`store` 等关联导航属性，查询时自动下推为高效的 `EXISTS` 子查询；
3. **私有 DSL 彻底拔除**：物理删除 `keyword-search-engine.ts`，全仓业务 Service 与 UI 模板回归全网主流的纯原生模式。

## 二、 关键变更与涉及模块

1. **数据库与迁移层**：
   - 各切片 Schema 开启 `relationMode = "prisma"` 并规范化显式 `onDelete/onUpdate`；
   - `tooling/db-migrate` 注册并生成 DROP 物理外键迁移。
2. **业务切片重构**：
   - `order-center`：销售订单切换为 Prisma 原生 `customer: { customerName: ... }` 关系过滤；
   - `customer-center`：客户与门店列表使用纯强类型 Where 组装；
   - `material-center` / `procurement-center` / `tenant-admin`：清理私有 `SearchContract`，改为标准 `keywordPlaceholder`。
3. **底座共享库**：
   - `@base/shared`：删除 `keyword-search-engine.ts`，保留纯纯粹的字符串清洗工具；
   - `@base/ui`：`DataTable` 移除私有 `searchContract` 属性。
4. **门禁与规范**：
   - `check-redlines.mjs`：移除旧规则，升级为标准红线；
   - `.agents/skills/next-saas-base-dev/`：同步更新开发宪法文档。

## 三、 遗留事项与后续建议

- 本次改动后全仓 16 包类型检查与 250+ 单测已 100% 验证通过；
- 建议尽快提交代码，保持分支纯净。
