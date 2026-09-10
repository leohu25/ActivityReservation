# @chenrun/db-tenant

多租户 SaaS 系统的**数据面连接池中枢与租户物理库架构底座（Data Plane DB Manager & Tenant Kernel）**。

## 1. 模块定位与职责

本模块遵循 ADR-002（PostgreSQL Database-per-Tenant 物理强隔离）设计，是租户业务数据层的心脏：

- **物理连接池聚合管理 (`TenantDbManager`)**：依据可信租户凭据索引（`secretRef`）实现动态路由与连接复用，提供防止 Next.js HMR 泄漏的单例连接池与优雅关闭（`closeAll`）。
- **统一租户 Prisma Client (`TenantPrismaClient`)**：基于 Canonical Schema 统一生成并向全系统 Feature 提供强类型数据库客户端，彻底消除业务包私造连接池与重复驱动。
- **租户自动化开通与迁移引擎 (`TenantProvisioner` / `TenantMigrationRunner`)**：支持新租户入驻时物理建库（`CREATE DATABASE`）、基线 Schema 迁移与执行台账对齐。
- **组织人事底座与部门树拓扑 (`department-topology` / `database-seeder`)**：提供部门树展开、防环检测、主管与多级子部门计算，以及开通租户时的初始 ROOT 部门、岗位字典与 Owner 档案注入。

## 2. 内部架构分层与真实文件树

```
packages/db-tenant/
├── prisma/
│   ├── schema.prisma                 # 租户基础组织人事 Schema (部门、岗位、员工档案、公司资料)
│   └── schema.generated.prisma       # 聚合了全仓 Feature 模型的 Canonical Schema (自动生成)
├── prisma.config.ts                  # Prisma 7 配置文件
├── src/
│   ├── pool/                         # 连接池中枢与动态路由
│   │   └── manager.ts                # TenantDbManager, getTenantDbManager, createTenantPrismaClient
│   ├── migration/                    # 数据库自动化开通与版本迁移引擎
│   │   ├── migration-types.ts        # 迁移接口契约与入参模型
│   │   ├── sql-executor.ts           # PostgreSQL 原生 DDL/SQL 驱动执行器
│   │   ├── migration-runner.ts       # 租户幂等迁移流转与失败阻断引擎
│   │   └── tenant-provisioner.ts     # 新租户开通物理建库与版本对齐
│   ├── topology/                     # 组织人事与部门树拓扑
│   │   └── department-topology.ts    # collectDepartmentTreeIds, resolveEmployeeTopology (Fail-Closed)
│   ├── seed/                         # 租户初始基线种子数据填充
│   │   └── database-seeder.ts        # TenantDatabaseSeeder (ROOT部门、岗位字典、Owner档案)
│   └── index.ts                      # 统一平滑聚合导出入口
└── README.md
```

## 3. 核心 API 与使用示例

### 3.1 获取租户数据库连接池客户端

```ts
import { getTenantDbManager } from "@chenrun/db-tenant";

// 通过单例管理器获取已授权租户的专属 Prisma 客户端
const manager = getTenantDbManager({ repository: tenantContextRepository });
const tenantPrisma = await manager.getClient(organizationId);

// 执行租户专属业务读写
const employees = await tenantPrisma.employeeProfile.findMany({
  where: { status: "ACTIVE" },
});
```

### 3.2 部门树拓扑与数据范围判定

```ts
import { resolveEmployeeTopology, collectDepartmentTreeIds } from "@chenrun/db-tenant";

// 依据用户档案自驱装配完整的部门树拓扑
const topology = await resolveEmployeeTopology(tenantPrisma, employeeProfile.id);
// topology.departmentTreeIds 包含当前部门及所有递归子部门 ID，用于 CASL DEPT_TREE SQL 下推
```

## 4. 关键红线与架构原则

1. **绝对物理隔离**：各租户数据分布在独立物理库中，严禁混用连接，严禁跨租户直接连表查询。
2. **连接池单例与防泄漏**：服务端使用 `getTenantDbManager()` 获取单例，严禁在 Server Action 或业务 Service 中随意 `new PrismaClient()`。
3. **零明文连接串注入**：只能使用 Control DB 提供的 `secretRef` 解析连接串，客户端无法篡改连接目标。

## 5. 验证命令

```bash
# 类型检查
pnpm --filter @chenrun/db-tenant check

# 单元测试 (23 个测试用例全部通过)
pnpm --filter @chenrun/db-tenant test
```
