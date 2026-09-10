# @chenrun/auth

辰润 ERP 的**多租户身份认证与可信会话上下文核心（Authentication & Tenant Context Kernel）**。

## 1. 模块定位与职责

本模块是多租户企业 ERP 系统的第一道安全大门，承接 ADR-002（多租户物理隔离）与 ADR-003（租户会话边界防线）。
它专注于回答**“你是谁、属于哪个企业、业务库指向哪里”（Who are you & Where is your database）**：

- **Better Auth 服务端引擎**：基于 `better-auth` 与 `organization` 插件，对接 Control DB 实现用户登录、注册、企业归属验证。
- **可信租户上下文提取 (`resolveTenantContext`)**：严格从已签名的 HTTP Session 中解析 `organizationId`，**坚决不信任客户端自行传递的租户 ID 参数**，并从 Control DB 中核验该用户是否具备合法 Member 身份以及目标租户的物理库是否为 `ACTIVE` 状态。
- **租户准入门禁断言 (`assertTenantAccessGate` / `assertEmployeeActive`)**：在进入业务逻辑前严格断言员工档案（`EmployeeProfile.status === "ACTIVE"`），任何 `SUSPENDED`（暂停）、`TERMINATED`（离职）或未激活人员均在毫秒级以 Fail-Closed 阻断。
- **纯粹化基础设施 (零 UI 耦合)**：本包彻底移除了前端 UI 组件（如模态框、切换按钮下沉至 `packages/features/tenant-admin`），剥离了对 `@chenrun/ui` 的依赖，成为纯粹的**认证与上下文内核**。
- **双端同构分离**：通过 `package.json` 的 `exports` 规范分离服务端（`.` -> `src/index.ts`）与浏览器端（`./client` -> `src/client.ts`），防止 Prisma 客户端和安全密钥泄露至前端。

## 2. 内部架构分层与真实文件树

```
packages/auth/
├── src/
│   ├── server/                         # 服务端 Better Auth 运行时与权限桥接
│   │   ├── server.ts                   # createServerAuth, getServerAuthRuntime
│   │   ├── access-control.ts           # Better Auth 组织权限适配器
│   │   └── server.test.ts              # 服务端单测
│   ├── context/                        # 租户可信会话与准入门禁断言 (Fail-Closed)
│   │   ├── tenant-context.ts           # TenantContext 核心契约, resolveTenantContext, assertTenantAccessGate
│   │   ├── trusted-tenant-context.ts   # 基于 HTTP Headers 的依赖注入上下文解析器
│   │   └── tenant-context.test.ts      # 上下文单测
│   ├── client.ts                       # 前端 SDK 纯单例入口 (authClient, signIn, signUp, useSession)
│   └── index.ts                        # 服务端统一聚合导出入口
└── README.md
```

## 3. 核心 API 与使用示例

### 3.1 在 Next.js 服务端获取当前可信租户上下文

```ts
import { getCurrentTenantContext } from "@chenrun/auth";
import { headers } from "next/headers";

// 严格通过签名 Session Header 验签并提取租户上下文
const reqHeaders = await headers();
const tenantContext = await getCurrentTenantContext(reqHeaders);

// tenantContext 包含用户身份、租户 ID、成员角色及物理库元数据
console.log(tenantContext.organizationId);
console.log(tenantContext.database.secretRef);
```

### 3.2 员工在职状态与门禁硬断言

```ts
import { assertTenantAccessGate } from "@chenrun/auth";

// 校验员工档案生命周期，非 ACTIVE 状态直接抛出 TenantContextError 中断
assertTenantAccessGate(employeeProfile);
```

### 3.3 客户端登录认证 SDK

```tsx
"use client";
import { authClient, signIn, signOut } from "@chenrun/auth/client";

export function UserProfile() {
  const { data: session } = authClient.useSession();

  return (
    <div>
      <span>{session?.user?.name}</span>
      <button onClick={() => signOut()}>退出登录</button>
    </div>
  );
}
```

## 4. 安全红线与架构原则

1. **绝对禁止信任前端 organizationId**：所有租户识别必须基于服务端已验签的 Session `activeOrganizationId`，严禁从 URL Query、URL Path 或请求体信任租户 ID。
2. **Fail-Closed 严格准入**：未分配组织、离职人员、停用组织或租户物理库未开通时，必须立即抛错阻断，严禁降级放行。
3. **零 UI 依赖与单向倒置**：`auth` 仅作为认证底座，零依赖 `@chenrun/ui`，仅依赖 `@chenrun/db-control`（中心管控库），绝对不反向依赖上层应用或 `@chenrun/authorization`。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @chenrun/auth check

# 单元测试与门禁断言 (15 个测试用例全部通过)
pnpm --filter @chenrun/auth test
```
