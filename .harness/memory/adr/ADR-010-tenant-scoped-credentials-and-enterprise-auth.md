# ADR-010: 多租户独立凭证模型与企业三要素认证架构 (Tenant-Scoped Credentials & 3-Factor Auth)

## 状态

Accepted（2026-09-22）

## 背景

在引入 Better Auth 早期，系统沿用了类似 GitHub/Slack 的消费级全局 User 模型（以全局唯一 `email` 作为主键）。
但在严肃企业级 ERP（ToB）场景下，这种消费级模型暴露出严重的安全漏洞与业务死锁：

1. **同名串号与多租户越权风险**：
   - 企业一线员工（如车间工人、外聘经办、采购员）很多没有企业邮箱，系统需要支持工号（如 `001`）、手机号或自定义英文账号；
   - 若租户 A 和租户 B 的 HR 碰巧录入了相同的工号（如 `001`）或相同的手机号，全局 User 模型会将两者误判为同一个自然人；
   - 导致租户 B 的员工登录后赫然列出租户 A 的企业空间，造成严重的数据越权泄露。
2. **跨企业改密覆盖隐患 (Critical Bug)**：
   - 之前在开通新租户或录入员工时，若填写的邮箱在全局已存在，系统曾错误地执行 `account.update` 覆盖其密码，导致老租户老板在自己的企业被恶意改密失效。
3. **多租户选择混乱与“打补丁”反模式**：
   - 员工登录时输入密码后，系统弹窗要求“二选一企业”，但两家企业的密码根本不同，逻辑产生悖论；
   - 曾一度通过 `split("@")[0]` 截断邮箱并做模糊猜测查询，严重破坏了数据保真度（Data Fidelity）。

## 决策

### 采用路径：租户独立凭证模型 (Tenant-Scoped) + 官方 Better Auth 自定义扩展插件

### 1. 数据库模型：`TenantAccount` 实体隔离
在平台总控库（Control DB）设立带租户作用域的凭证事实源：
```prisma
model TenantAccount {
  id             String       @id @default(uuid(7)) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  account        String       @db.VarChar(64) // 支持工号、手机号、邮箱、自定义英文
  password       String       @db.VarChar(255) // Scrypt 加盐哈希
  name           String       @db.VarChar(100)
  memberId       String?      @map("member_id") @db.Uuid
  status         String       @default("ACTIVE") @db.VarChar(20)
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, account]) // 👈 核心铁律：企业内唯一，跨企随便同名！
  @@map("tenant_account")
}
```

### 2. 双平面认证彻底分离
- **平台总控中枢 (`apps/control`)**：采用全局超管通行证登录（`CONTROL_BOOTSTRAP_ADMIN_*`），专门服务平台系统运维人员；
- **业务租户端 (`apps/tenant`)**：采用工业标准**“企业编码 (Slug) + 账号/工号/手机号 + 密码”**三要素登录。

### 3. 严格字面量保真铁律 (Strict Literal Fidelity)
- 用户输入什么，数据库就精确存储什么；查询时就严格精确匹配什么；
- **严禁**自动截断 `@` 字符，**严禁**在查询端编写 `[account, account.split("@")[0]]` 这类代偿性的模糊猜测补丁。

### 4. 遵循 Better Auth 官方扩展插件范式
- 拒绝手写 Route Handler 中继转发；
- 封装官方第一等标准插件 **`tenantCredentialsPlugin`**，挂载原生端点 `/sign-in/tenant`；
- 内部调用 `ctx.context.internalAdapter.createSession` 原生签发 Session，使用 `setSessionCookie` 原生设置标准安全 Cookie，直通工作台，彻底消灭“二选一企业”弹窗。

## 后果与收益

1. **绝对安全隔离**：不同租户随便同名，各自拥有独立加盐密码，密码覆盖与串号漏洞被物理级消灭；
2. **支持任意凭据形态**：工号、手机号、自定义账号开箱即用；
3. **架构零代码熵增**：通过官方推荐的 Plugin 范式无缝融入 Better Auth 生命周期，完美继承 CASL 权限与动态分库连接池。

## 参考

- `packages/base/auth/src/server/tenant-credentials-plugin.ts`
- `packages/base/db-control/prisma/schema.prisma`
- `.agents/skills/next-saas-base-dev/references/8-base-infrastructure.md`
