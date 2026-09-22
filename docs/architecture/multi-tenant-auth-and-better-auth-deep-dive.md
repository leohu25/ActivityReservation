# 企业级多租户认证授权体系与 Better Auth 深度集成白皮书

> **版本**：v2.0 (生产级架构事实源)  
> **适用范围**：`apps/tenant`（租户数据平面）、`apps/control`（平台管控平面）、`packages/base/*`、`packages/platform/*`

---

## 目录
1. [系统总体架构与平面划分](#一系统总体架构与平面划分)
2. [数据表全景字典与字段级定义](#二数据表全景字典与字段级定义)
3. [端到端登录流程详解 (Authentication Flow)](#三端到端登录流程详解-authentication-flow)
4. [API 调用与服务端鉴权机制 (Authorization Flow)](#四api-调用与服务端鉴权机制-authorization-flow)
5. [多租户动态物理分库路由 (TenantDbManager)](#五多租户动态物理分库路由-tenantdbmanager)
6. [账号命名空间与防冲突机制](#六账号命名空间与防冲突机制)

---

## 一、系统总体架构与平面划分

本系统采用现代企业级 SaaS 标准的 **“双平面分离” (Dual-Plane Architecture)** 与 **“Database-per-Tenant 物理强隔离”** 架构：

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        平台管控平面 (Control Plane - Control DB)                         │
│  • 负责大门安保：全局认证 (Better Auth)、租户开通 (Organization)、分库路由账本 (TenantDb)  │
│  • 负责安全前置门禁：四层权限策略定义 (CASL Rules in OrganizationRole)、会话签名 (Session) │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ 动态路由 (TenantDbManager)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        租户数据平面 (Data Plane - 独立 Tenant DB)                        │
│  • 纯业务资产：员工档案 (EmployeeProfile)、部门岗位 (Department/Position)               │
│  • ERP 核心单据：客户中心、物料中心、配方BOM、销售与采购订单等 (物理隔离，安全零穿透)      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、数据表全景字典与字段级定义

### 1. 平台公共总控库 (Control DB - `packages/base/db-control/prisma/schema.prisma`)

#### (1) `user` (平台全局认证主体 - Better Auth 核心)
负责在平台层面标识一个自然人/登录主体，所有浏览器 Session 必须挂靠于该表。
- `id` (UUIDv7, PK): 全局唯一用户主键。
- `name` (String): 用户真实姓名/展示昵称。
- `username` (String, Unique): **系统登录主键标识**，格式为 `{slug}:{account}`（如 `chenrun:admin`），彻底杜绝跨租户同名账号冲突，无假邮箱。
- `email` (String?, Nullable): 可选联系邮箱，仅在用户主动绑定时存在，不作为强制主键。
- `emailVerified` (Boolean): 邮箱是否通过验证。
- `image` (String?): 全局账号头像 URL。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (2) `session` (当前登录会话 - Better Auth 核心)
承载客户端登录状态，作为受控 Cookie 的服务端凭证。
- `id` (UUIDv7, PK): 会话主键。
- `token` (String, Unique): 签名会话随机 Token，以 HttpOnly 安全 Cookie 形式存在浏览器。
- `userId` (UUIDv7, FK -> `user.id`): 会话对应的用户主体。
- `activeOrganizationId` (UUIDv7?, FK -> `organization.id`): **当前会话正在操作的企业组织ID**。每次请求据此锚定租户上下文。
- `expiresAt` (DateTime): 会话到期失效时间戳。
- `ipAddress` (String?): 客户端真实 IP。
- `userAgent` (String?): 客户端浏览器/设备指纹。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (3) `account` (认证凭据提供方 - Better Auth 核心)
记录具体凭证类型与哈希映射（支持本地密码或第三方 OAuth）。
- `id` (UUIDv7, PK): 凭据主键。
- `userId` (UUIDv7, FK -> `user.id`): 所属用户 ID。
- `providerId` (String): 凭据提供方类型（如 `"credential"` 密码凭据、`"wechat"` 微信扫码等）。
- `accountId` (String): 对应提供方的外部唯一 ID（本地凭据等于 `userId`）。
- `password` (String?): Scrypt 加盐哈希加密后的密码（仅平台超管等本地凭证使用）。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (4) `verification` (安全验证凭据 - Better Auth 核心)
存储验证码、重置密码凭证、短期签名 Token。
- `id` (UUIDv7, PK): 验证凭据主键。
- `identifier` (String): 验证目标标识（如手机号、账号）。
- `value` (String): 动态哈希验证码。
- `expiresAt` (DateTime): 验证码过期时间。
- `createdAt` / `updatedAt` (DateTime): 生成时间戳。

#### (5) `organization` (租户企业空间主体 - SaaS 根节点)
企业租户的顶级物理隔离主体。
- `id` (UUIDv7, PK): 企业唯一 ID。
- `name` (String): 企业法定全称（如 "示范工贸制造有限公司"）。
- `slug` (String, Unique): **企业唯一英文代号/二级域名**（如 `chenrun`），用于登录定位企业。
- `logo` (String?): 企业品牌 Logo 图片 URL。
- `metadata` (String?): JSON 扩展元数据（包含系统显示标题 `systemName`、单据编号规则等）。
- `authorizationVersion` (Int, Default 1): **权限版本号**。租户内任意角色权限发生变更时自增，使该企业所有成员的 CASL 内存缓存即刻失效重建。
- `createdAt` (DateTime): 企业创建入驻时间。

#### (6) `member` (租户成员关系表 - Better Auth 组织扩展)
连接 `User` 与 `Organization` 的多对多纽带。
- `id` (UUIDv7, PK): 成员主键（对应员工档案中的 `memberId`）。
- `organizationId` (UUIDv7, FK -> `organization.id`): 所属企业 ID。
- `userId` (UUIDv7, FK -> `user.id`): 关联平台用户 ID。
- `role` (String): 成员角色代码（支持多角色逗号分割，如 `"owner"`、`"admin,warehouse_manager"`）。
- `createdAt` (DateTime): 加入企业时间。

#### (7) `organization_role` (租户自定义角色与 CASL 权限策略 - 四层权限 SSoT)
企业自定义角色与页面、按钮、字段及数据范围策略存储地。
- `id` (UUIDv7, PK): 角色主键。
- `organizationId` (UUIDv7, FK -> `organization.id`): 归属企业 ID。
- `role` (String): 角色英文代号（如 `warehouse_operator`，租户内唯一）。
- `permission` (String): **CASL 声明规则序列化 JSON**（包含 Actions、Subjects、FieldsPolicies、DataScopes）。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (8) `tenant_account` (租户内员工独立账号密码本)
实现免邮箱、纯工号/手机号登录的私有凭据表。
- `id` (UUIDv7, PK): 凭据主键。
- `organizationId` (UUIDv7, FK -> `organization.id`): 所属企业 ID。
- `account` (String): **纯登录账号/工号/手机号**（如 `EMP001`、`admin`），租户内唯一。
- `password` (String): Scrypt 加盐哈希加密后的私有密码。
- `name` (String): 员工姓名快照。
- `memberId` (UUIDv7?, FK -> `member.id`): 直通对应的成员记录。
- `status` (String): 账号状态（`"ACTIVE"` 在职启用 / `"DISABLED"` 停用）。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (9) `tenant_database` (物理分库路由总账 - Database-per-tenant 事实源)
每家企业专属物理数据库的连接定位总账。
- `id` (UUIDv7, PK): 路由记录主键。
- `organizationId` (UUIDv7, Unique, FK -> `organization.id`): 1:1 绑定的企业 ID。
- `clusterCode` (String): 数据库所在集群代号（如 `pg-cluster-01`）。
- `databaseName` (String): 真实 PostgreSQL 物理数据库名（如 `tenant_chenrun`）。
- `secretRef` (String): 连接密码环境变量/KMS 密钥引用（杜绝明文写入）。
- `schemaVersion` (String): 当前已打入的最新 Prisma 数据库版本号。
- `status` (Enum: `PROVISIONING` | `ACTIVE` | `SUSPENDED` | `FAILED`): 物理库生命周期。
- `createdAt` / `updatedAt` (DateTime): 审计时间戳。

#### (10) `tenant_migration` (租户物理分库版本演进台账)
记录租户独立物理库自愈迁移的执行日志，包含 `migration_name`、`version`、`status`、`execution_time_ms` 等。

#### (11) `platform_migration` (平台总控库 12-Factor 自愈台账)
记录 Control DB 自身的迁移版本与校验和（`checksum`）。

---

### 2. 租户独立物理库 (Tenant DB - `packages/base/db-tenant/prisma/schema.prisma`)

#### (1) `employee_profile` (员工业务档案表 - 物理内聚于企业专属库)
存储企业内部完整的真实员工档案。
- `id` (UUIDv7, PK): 员工档案主键。
- `memberId` (String?, Unique): 关联平台控制库的 `Member.id`。
- `userId` (String?): 关联平台控制库的 `User.id`。
- `employeeNo` (String?, Unique): 企业内部工号（如 `EMP-2026-001`）。
- `name` (String): 员工真实姓名。
- `email` (String): 员工真实业务/联系邮箱（纯业务字段，无全局唯一约束）。
- `phone` (String?): 员工手机号码。
- `departmentId` (UUIDv7?, FK -> `department.id`): 归属业务部门。
- `positionId` (UUIDv7?, FK -> `position.id`): 业务岗位。
- `managerEmployeeId` (UUIDv7?, FK -> `employee_profile.id`): 直属主管。
- `avatarUrl` (String?): **员工工牌照/头像访问 URL**（存储在 MinIO/OSS 中）。
- `status` (String): `"ACTIVE"` (在职) / `"TERMINATED"` (离职) / `"SUSPENDED"` (停职)。
- `joinedAt` (DateTime?): 入职时间。
- 基础审计 8 大字段（`createdById`, `deptId`, `createdAt`, `isDeleted` 等）。

---

## 三、端到端登录流程详解 (Authentication Flow)

员工在租户登录端（`apps/tenant`）输入三要素登录的端到端调用时序：

```text
[浏览器前端]                [Tenant Next.js API]          [Control DB (平台库)]         [Tenant DB (企业独立库)]
     │                                │                            │                           │
     │ 1. POST /api/auth/sign-in/tenant│                            │                           │
     │    { organizationSlug: "cr",   │                            │                           │
     │      account: "admin",         │                            │                           │
     │      password: "******" }      │                            │                           │
     ├───────────────────────────────>│                            │                           │
     │                                │ 2. 查询 Slug 对应的企业    │                           │
     │                                ├───────────────────────────>│                           │
     │                                │    SELECT * FROM org...    │                           │
     │                                │<───────────────────────────┤                           │
     │                                │                            │                           │
     │                                │ 3. 查询租户独立凭据        │                           │
     │                                ├───────────────────────────>│                           │
     │                                │    WHERE orgId & account   │                           │
     │                                │<───────────────────────────┤                           │
     │                                │                            │                           │
     │                                │ 4. Scrypt 比对密码哈希    │                           │
     │                                │ 5. 校验通过，提取 memberId │                           │
     │                                │    并定位 User (cr:admin)  │                           │
     │                                │                            │                           │
     │                                │ 6. Better Auth 签发 Session│                           │
     │                                ├───────────────────────────>│                           │
     │                                │    INSERT INTO session     │                           │
     │                                │    (activeOrgId=org.id)    │                           │
     │                                │<───────────────────────────┤                           │
     │                                │                            │                           │
     │ 7. Set-Cookie: better-auth.session_token (HttpOnly)         │                           │
     │<───────────────────────────────┤                            │                           │
```

---

## 四、API 调用与服务端鉴权机制 (Authorization Flow)

登录成功后，用户发起任何业务请求（如获取物料列表、审批工单）：

```text
[浏览器前端]                  [Server Action / RSC]        [Control DB]           [Tenant DB (专属物理库)]
     │                                │                         │                           │
     │ 1. 发起请求 (带 Session Cookie) │                         │                           │
     ├───────────────────────────────>│                         │                           │
     │                                │ 2. 校验 Session 有效性  │                           │
     │                                ├────────────────────────>│                           │
     │                                │<────────────────────────┤                           │
     │                                │    获取 activeOrgId &   │                           │
     │                                │    member.role 角色     │                           │
     │                                │                         │                           │
     │                                │ 3. 构造 CASL 权限规则   │                           │
     │                                ├────────────────────────>│                           │
     │                                │    读 organization_role │                           │
     │                                │<────────────────────────┤                           │
     │                                │    编译出 ability 对象  │                           │
     │                                │                         │                           │
     │                                │ 4. 门禁断言:             │                           │
     │                                │    ability.can('read',  │                           │
     │                                │       'Material')       │                           │
     │                                │    【无权直接 403 阻断】 │                           │
     │                                │                         │                           │
     │                                │ 5. 动态物理库路由:      │                           │
     │                                ├────────────────────────>│                           │
     │                                │    查 tenant_database   │                           │
     │                                │<────────────────────────┤                           │
     │                                │    TenantDbManager 解析 │                           │
     │                                │                         │                           │
     │                                │ 6. 下推 SQL 数据范围执行 ─────────────────────────>│
     │                                │    SELECT * FROM material WHERE dept_id IN (...)    │
     │                                │<────────────────────────────────────────────────────┤
     │ 7. 返回脱敏后的业务纯数据      │                         │                           │
     │<───────────────────────────────┤                         │                           │
```

---

## 五、多租户动态物理分库路由 (TenantDbManager)

在 `packages/base/db-tenant` 中，`TenantDbManager` 维系着一套**多租户动态数据库连接池**：

1. **零硬编码**：业务代码中严禁拼接直连 URL，必须通过 `getTenantDbManager().getClient(orgId)` 获取客户端；
2. **连接池复用与防击穿**：
   - 内存维护 `Map<string, TenantPrismaClient>` 缓存已初始化的租户连接池；
   - 内部包含 `Map<string, Promise<Client>>` 初始化闭锁，避免多请求并发打到同一未就绪租户物理库时引发连接击穿；
3. **安全隔离屏障**：
   - 租户 A 的员工发起的 SQL，其物理连接只能访问 `tenant_A` 库，从底层杜绝因代码漏洞产生跨租户数据串色。

---

## 六、账号命名空间与防冲突机制

### 为什么必须使用 `{slug}:{account}` 命名空间？
在制造与通用 ERP 场景中，不同企业存在同名账号是刚性客观事实：
- 企业 A（`slug: chenrun`）开户，管理员账号为 `admin`；
- 企业 B（`slug: food_factory`）开户，管理员账号也为 `admin`。

### 隔离设计：
1. **`tenant_account`**：
   - 拥有 `@@unique([organizationId, account])` 复合唯一索引；
   - 辰润有 `[org_A, "admin"]`，食品厂有 `[org_B, "admin"]`，各自在租户内唯一。
2. **Better Auth `user` 表**：
   - 格式统一为 `username = `${org.slug}:${account}``（如 `chenrun:admin` 和 `food_factory:admin`）；
   - 全局唯一，既满足 Better Auth 核心插件的原生要求，又彻底告别假邮箱，真实展现了多租户命名空间隔离。

---

## 七、`tenant_account` 与 `account` 边界判定与使用场景规范

在架构演进中，针对“为什么有了 Better Auth 的 `account` 表，还需要 `tenant_account` 表”，必须明确两者的**业务域边界（Realm Boundary）**，坚决杜绝双写冗余：

### 1. 两张表的职责与适用场景

| 维度 | `tenant_account` (租户专属凭据表) | `account` (Better Auth 官方凭据表) |
| :--- | :--- | :--- |
| **所属业务域** | **租户企业员工域 (Tenant Realm)** | **平台运维管控域 (Platform Realm) / 第三方 OAuth** |
| **主键与唯一性** | `@@unique([organizationId, account])`<br>（在**当前租户内部**唯一） | `@@unique([providerId, accountId])`<br>（在**全平台全局**唯一） |
| **密码存储内容** | 租户企业员工的私有 Scrypt 密码哈希 | 平台超级管理员本地密码 / OAuth 授权凭据（微信、GitHub等） |
| **登录接入端点** | `POST /api/auth/sign-in/tenant`<br>（输入：企业代号 + 工号/账号 + 密码） | `POST /api/auth/sign-in/email`<br>（平台总控端超管登录） |
| **适用人群** | **100% 的企业员工**（厂长、车间工人、采购、财务等） | **极少数平台运维人员**（控制台运维人员），或未来第三方全局打通 |

### 2. 为什么严禁“双写”（Double-Write Anti-Pattern）？
- **数据一致性灾难**：如果开户时同时写入 `tenant_account` 和 `account`，员工在租户端改密码时，只会更新 `tenant_account`；导致 `account` 表残留着过期的脏密码，造成数据分裂。
- **职责错位**：租户端登录从始至终只消费 `tenant_account`，往 `account` 写入租户员工密码不仅 0 次被消费，还污染了全局凭证池。
- **铁律原则**：
  > **租户端人员（无论是租户超管还是普通员工），密码有且仅有一份，必须 100% 单一归口存在 `tenant_account` 中；严禁向 `account` 插入任何租户密码！**

---

## 八、未来架构演进与能力扩展指引

随着业务规模扩大与企业协同升级，系统未来如果需要扩展新的认证与账号能力，推荐遵循以下扩展指引：

### 1. 扩展场景 A：支持员工微信扫码或企业微信 / 钉钉免密登录
- **如何复用 `account` 表？**
  - 这正是 `account` 表的真正价值所在！
  - 当员工在企业内部绑定微信或企业微信时：
    - 在 `account` 表插入一条记录：
      - `providerId`: `"wechat_work"` 或 `"dingtalk"`
      - `accountId`: 第三方企业员工 openid/unionid
      - `userId`: 对应当前员工的 `User.id`
  - 扫码回调成功后，Better Auth 验证通过，直接为该 `userId` 签发挂载了该租户企业 ID 的 Session。

### 2. 扩展场景 B：支持一个自然人（同一手机号）兼任多家企业顾问/供应商
- **演进路线**：
  1. 在 `user` 表中将员工真实手机号维护在统一自然人档案中；
  2. 当该手机号加入企业 B 时，不新建 `User`，而是在 `member` 表新增一条归属于企业 B 的记录；
  3. 用户登录后，服务端返回该自然人所属的 `Member` 列表：`[辰润工贸, 好味道食品]`；
  4. 用户选择“进入好味道”，调用 `setActiveOrganization({ organizationId: "org_haoweidao" })`；
  5. Session 的 `activeOrganizationId` 瞬间切换，物理数据库连接池立即热切换至好味道的专属独立库。

## 九、核心架构特性：为什么租户凭据必须托管在控制平面 (Control Plane)？

很多初涉分库架构的工程师常有一个直觉误区：*“既然业务数据在租户独立物理库，为什么员工密码不也存在租户库？”*

本系统将 `TenantAccount` 收敛在平台控制库（Control DB），**绝非权宜之计，而是现代云原生企业级 SaaS 的核心安全架构特性（Feature，Not a Bug）**，直接对标 AWS IAM 与 Shopify Multi-Store Pod 架构标准：

### 1. 防线绝对前置，杜绝“未授权流量击穿物理库” (Anti-DDoS / Anti-Penetration)
- **如果密码在租户物理库**：公网上任何针对 `/sign-in` 的暴力破解、字典攻击或恶意探测，服务器在不知道密码对错前，都必须**先去连接池建立到租户物理实例的 TCP 连接**并执行 SQL。黑客只需用自动化脚本轮询不同租户，就能在数秒内耗尽所有租户物理数据库的连接池，引发全站雪崩。
- **控制平面门禁前置**：未通过身份校验的非法请求，**在进入外围网络（Control Plane）时即被 401 拦截抛弃**。租户深处的专属物理数据库免于承受任何未授权探测，连一条无意义的 SQL 都不会执行。

### 2. 避免“鸡生蛋还是蛋生鸡”的路由死锁 (Routing Deadlock Prevention)
- 要连接租户专属物理库，首先必须从会话中获取合法的 `activeOrganizationId` 与受信任租户上下文；
- 只有先在控制平面验明正身（`TenantAccount` 校验通过并签发 `Session`），路由引擎 `TenantDbManager` 才有资格合法去读取 `tenant_database` 账本并打开租户库。将凭据置于控制面彻底解开了这一认证与路由循环依赖。

### 3. 数学级与密码学安全保障 (Cryptographic Safety)
- **Scrypt 高强度不可逆抗 ASIC 耗时哈希**：即使控制库遭遇极端拖库，单向哈希特性在数学上确保真实明文绝对不可逆推；
- **租户复合命名空间强隔离**：`@@unique([organizationId, account])` 确保即使不同企业有同名账号，租户间凭据作用域互不穿透；
- **真实连接串物理脱敏**：控制库仅记录 `secretRef`（密钥索引），物理业务库的真实连接串与账密完全托管于 KMS 或隔离环境变量中，控制面数据无法直接登录业务库。


