# @base/shared

通用 SaaS 的**全局无状态共享工具底座与通用类型契约（Shared Utilities & Domain Primitives）**。

## 1. 模块定位与职责

本模块是 Monorepo 中最底层的通用基础包，遵循纯函数、强类型、零业务副作用原则：

- **通用契约与类型定义 (`types/`)**：提供标准分页契约（`PaginationParams`, `PaginatedResult`）、基础实体基类字段、通用查询类型。
- **标准化 API 契约与函数式单子 (`api/`)**：提供统一的 `ApiResponse` 接口、`apiSuccess` / `apiError` 工厂函数、`Result<T, E>` / `Either` 结构，统一全系统前后端交互契约。
- **全局统一异常体系 (`errors/`)**：提供体系化错误类（`AppError`, `BusinessError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError` 等），支持机器可读的 `code` 与 HTTP 状态映射。
- **跨模块常量 (`constants/`)**：维护环境、系统保留标识、公共格式化模板等不变常量。
- **纯函数工具集 (`utils/`)**：
  - `format`: 金额、货币（分转元）、日期、百分比格式化工具。
  - `tree`: 树形数据构建、平铺、父子节点查找等组织架构/类目通用算法。
  - `mask`: 手机号、身份证、敏感金额的脱敏函数（用于字段级权限与日志审计）。
  - `collection`: 集合操作、分组、去重、安全字典索引。
  - `validation`: 通用正则与业务标识格式校验。
- **RSC 序列化转换器 (`toPlainData`)**：集成 `superjson` 并注册 `Decimal.js`，在 Next.js Server Components 与 Client Components 边界彻底消除 Decimal 和日期序列化报错。
- **精选第三方库聚合导出**：对常用工具库（`radash`, `dayjs`, `superjson`, `decimal.js`）进行统一导出与能力对齐。

## 2. 内部架构与目录结构

```text
packages/shared/
├── src/
│   ├── api/                  # API 响应契约、Server Action 结果与函数式 Monad
│   ├── constants/            # 全局跨模块共享常量
│   ├── errors/               # 统一业务异常与错误码体系
│   ├── types/                # 通用 TypeScript 类型与分页定义
│   ├── utils/                # 纯函数无副作用工具库
│   ├── index.ts              # 统一聚合导出与 superjson 注册
│   └── *.test.ts             # 单元测试
└── package.json
```

## 3. 核心使用示例

### 3.1 统一 API 响应构造与处理

```ts
import { apiSuccess, apiError, AppError } from "@base/shared";

// 构造成功响应
const success = apiSuccess({ id: "123", name: "张三" });

// 构造业务错误响应
const error = apiError("RECORD_NOT_FOUND", "未找到指定资源", 404);
```

### 3.2 敏感数据脱敏

```ts
import { maskPhone, maskIdCard } from "@base/shared";

const safePhone = maskPhone("13812345678"); // 138****5678
```

### 3.3 RSC 边界 Decimal / 数据安全平铺

```ts
import { toPlainData } from "@base/shared";

// 在 Server Action 或 Server Component 传给 Client Component 前序列化
const clientSafeOrder = toPlainData(orderWithDecimals);
```

## 4. 架构原则与红线

1. **绝对无状态 (Pure & Stateless)**：严禁引入全局可变状态、连接池或副作用模块。
2. **零领域业务入侵**：本包仅允许纯粹的通用算法与技术契约，严禁堆砌特定业务领域逻辑（采购单据、审批流等必须在 features 中实现）。
3. **极简依赖**：除核心基础工具库外，严禁反向依赖 Monorepo 内的任何其他业务包或数据库包。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @base/shared check

# 运行单元测试
pnpm --filter @base/shared test
```
