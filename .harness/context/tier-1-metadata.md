# Tier 1：全局元数据与宪法约束 (Tier 1 Metadata)

> 消费预算：~1,000 Tokens。适用于会话启动自检与全局规则认知。

## 一、 系统基本事实

- **工程形态**：Turborepo + pnpm Workspace 模块化单体 (Modular Monolith)。
- **核心框架**：Next.js 16 App Router + React 19 + TypeScript 5。
- **数据库形态**：PostgreSQL 17 Database-per-Tenant 隔离（Control DB + Tenant DB）。
- **ORM**：Prisma 8 (双 client 机制)。

## 二、 五大工程红线

1. 严禁跨特性沙盒越界修改代码。
2. 严禁带病开发与未通过门禁前宣称完成。
3. 严禁手写魔术字符串权限码，必须使用 `P.*` 与 `F.*`。
4. 严禁绕过租户动态路由与物理数据库隔离。
5. 严禁破坏 Monorepo 依赖边界与 Server Component 直调规范。
