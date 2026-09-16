# @base/db-control

多租户 SaaS 系统的**管控面与全局拓扑事实源（Control Plane Database & Metadata Store）**。

## 1. 模块定位与职责

本模块连接单一中心管控库（`saas_control`），负责全平台的生命周期元数据与统一认证存储：

- **认证核心存储 (Better Auth)**：托管全局平台用户（`User`）、会话（`Session`）、认证凭据（`Account`）、邀请（`Invitation`）。
- **租户空间与拓扑**：托管企业租户组织（`Organization`）、租户成员归属（`Member`）、租户自定义动态角色与权限策略（`OrganizationRole`）。
- **物理库拓扑与生命周期**：托管每个租户的 Database-per-Tenant 物理数据库路由配置（`TenantDatabase`，通过 `secretRef` 安全引用连接凭据）及数据库演进台账（`TenantMigration`）。

## 2. 内部架构分层

模块源码位于 `src/`，按关注点分离原则划分：

```
packages/db-control/
├── prisma/                   # 中心管控库 Prisma Schema
│   └── schema.prisma
├── prisma.config.ts          # Prisma 7 统一配置文件
├── src/
│   ├── contracts/            # 领域实体类型与 DTO 契约
│   │   └── records.ts        # TenantDatabaseRecord, TenantMigrationRecord, OrganizationRoleRecord 等
│   ├── repositories/         # 仓储抽象接口契约 (纯接口，无 ORM 绑定)
│   │   └── interfaces.ts     # TenantContextRepository, AuthorizationRepository, TenantMigrationRepository
│   ├── prisma/               # Prisma 驱动适配器与客户端工厂
│   │   └── client.ts         # PrismaControlDbRepository, createControlPrismaClient
│   ├── cli.ts                # 管控库运维与迁移 CLI (control-migrate)
│   └── index.ts              # 统一平滑聚合导出入口
└── README.md
```

## 3. 核心 API 与使用示例

### 3.1 创建 Control DB 客户端

```ts
import { createControlPrismaClient, PrismaControlDbRepository } from "@base/db-control";

const prisma = createControlPrismaClient(process.env.CONTROL_DATABASE_URL!);
const controlRepo = new PrismaControlDbRepository(prisma);
```

### 3.2 消费抽象仓储接口（解耦 Prisma 细节）

```ts
import type { TenantContextRepository, AuthorizationRepository } from "@base/db-control";

// 用于解析当前用户在租户中的身份与租户物理库路由
const member = await controlRepo.findMember(organizationId, userId);
const tenantDb = await controlRepo.findTenantDatabase(organizationId);

// 用于 CASL 动态权限拉取
const roles = await controlRepo.findOrganizationRoles(organizationId, ["admin", "custom_role"]);
```

## 4. 安全红线与架构原则

1. **绝对禁止明文连接串**：`TenantDatabase` 实体仅存储 `secretRef` 索引，绝不在数据库明文存储密码或完整连接串。
2. **零租户业务污染**：管控库严禁出现业务单据（订单、客户等）表，租户业务数据必须由 `packages/db-tenant` 物理隔离路由。
3. **依赖倒置与可测试性**：上层业务与下游组件仅依赖抽象 Repository 接口，支持纯内存 Mock 测试。

## 5. 验证命令

```bash
# 运行类型检查
pnpm --filter @base/db-control check

# 运行单元测试
pnpm --filter @base/db-control test
```
