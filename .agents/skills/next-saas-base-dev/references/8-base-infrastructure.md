# 8. 平台基础设施与底座演进规范 (Base Infrastructure Guide)

> **定位**：本文档专门定义平台共享层 `@base/*` 的边界划分、演进原则与技术中立性要求。

---

## 一、 平台底座职责分工清单

| 基础包名 | 核心职责 | 绝对禁止事项 |
| :--- | :--- | :--- |
| **`@base/ui`** | 提供符合 shadcn 官方原语规范的通用原子与高阶复合组件（DataTable、FormModal、FormPage、DocumentShell、TreeFilter、toast 等）。 | 严禁包含任何业务领域专有逻辑或特定业务字段；保持绝对风格中立。 |
| **`@base/authorization`** | CASL 四层权限判定核心、Catalog 派生工具、声明式守卫（`AuthGuard`, `AuthField`）与租户上下文高阶工厂。 | 严禁硬编码具体的业务 Subject 名称或动作；一律基于泛型推导。 |
| **`@base/auth`** | 统一身份认证、Better Auth 封装与 Cookie 会话解析。 | 严禁越权处理具体业务权限逻辑（认证管进门，授权归 CASL）。 |
| **`@base/db-tenant`** | 多租户 Database-per-tenant 动态连接池管理、租户分库路由与部门拓扑解析。 | 严禁拼接直连数据库连接串；严禁跨租户穿透查询。 |
| **`@base/shared`** | 跨端序列化防线（`toPlainData`）、通用异常模型与 Server Action 核心包装器（`defineServerAction`）。 | 严禁引入任何带有副作用的原生浏览器宿主 API。 |

---

## 二、 演进三原则 (Evolution Principles)

1. **绝对业务中立原则**：
   - `@base/*` 导出的所有组件、工具函数与类型定义，必须适用于任何基于本底座衍生的全新 SaaS 业务项目；
   - 默认文本一律保持中立（如“保存”、“取消”、“请选择”、“全部”），严禁出现具体领域的特有文案。
2. **单向依赖硬红线**：
   - 底座包 `@base/*` 绝对禁止依赖上层任何业务包（`@domain/*`、`@platform/*` 或 `@biz/*`）；
   - 一旦在 `@base/*` 中发现对业务包的 import，门禁脚本将直接阻断提交。
3. **公共资产主动提炼**：
   - 业务切片开发中，一旦发现通用的布局形态、受控组件或通用工具，应主动提炼沉淀至 `@base/*`，严禁在业务包内私造重复轮子。
