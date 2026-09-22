# 租户私有凭据 OAuth 扩展架构规范 (Tenant Account OAuth Specification)

> **文档定位**：SaaS 平台租户级第三方扫码与免密认证扩展规范事实源  
> **核心机制**：**“身份凭证租户化隔离，会话管理 Better Auth 原生化归一”**  
> **适用场景**：微信公众号扫码登录、企业微信自建应用免密登录、钉钉扫码登录、飞书扫码登录

---

## 目录
1. [背景与架构设计原则](#一部署背景与设计原则)
2. [为什么第三方凭证必须挂载在 tenant_account？](#二为什么第三方凭证必须挂载在-tenant_account)
3. [数据库模型扩展设计 (Schema Extension)](#三数据库模型扩展设计-schema-extension)
4. [Better Auth 原生接入机制与完整时序](#四better-auth-原生接入机制与完整时序)
5. [双核心业务场景实现细节](#五双核心业务场景实现细节)
6. [企业级安全与离职阻断铁律](#六企业级安全与离职阻断铁律)

---

## 一、部署背景与设计原则

在制造、工贸及通用供应链 ERP 领域，员工账号具有极其鲜明的**“企业独占性”**：
- 员工在 A 企业的工号和权限，与在 B 企业的身份没有任何互通关系；
- 员工离职时，企业必须能够**秒级一键切断**其在当前企业的所有登录手段（包括工号密码、微信扫码、钉钉关联等）。

为此，本系统确立了 **“凭证外置隔离，会话引擎归一”** 的核心设计哲学：
```text
┌─────────────────────────────────────────────────────────────┐
│               外部认证凭据 (各企业独立私有资产)              │
│       工号+密码  |  企业微信 UserId  |  服务号 OpenID        │
└──────────────────────────────┬──────────────────────────────┘
                               │ 统一归口当前企业
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           租户专属凭据表: Control DB `tenant_account`        │
│          [organization_id + 专属凭证] 复合唯一隔离           │
└──────────────────────────────┬──────────────────────────────┘
                               │ 凭证校验通过，顺藤摸瓜定位 User
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Better Auth 官方原生会话引擎 (Session Engine)    │
│    • internalAdapter.createSession(userId) 原生签发 Token   │
│    • 注入 activeOrganizationId = org.id 锁定企业上下文      │
│    • setSessionCookie(ctx) 原生下发高安全 HttpOnly Cookie   │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、为什么第三方凭证必须挂载在 tenant_account？

对比将微信等凭据存放在全局 `account` 表与存放在 `tenant_account` 表的本质差异：

| 评估维度 | 挂载在全局 `account` 表 (反模式) | 挂载在 `tenant_account` 表 (推荐标准) |
| :--- | :--- | :--- |
| **隔离边界** | 全平台混在一起，无法表达企业独立性 | **死死封锁在当前企业内部**，天然租户物理隔离 |
| **企业微信/公众号适配** | 灾难。不同企业的 AppID/Secret 得到的 OpenID 范围不同，全局表极易串号 | **完美契合**。不同企业哪怕 OpenID 相同也因 `organizationId` 完全隔开 |
| **离职与权限回收** | 管理员在企业后台禁用员工时，全局凭据无法联动清理，产生安全漏洞 | **一键阻断**。只要把当前企业的 `tenant_account` 设为 `DISABLED`，所有扫码立即被拒 |
| **查询性能** | 需跨 `account` ➔ `user` ➔ `member` 多表 JOIN 才能确认企业归属 | **单表一条 SQL 秒出**：`WHERE org_id = ? AND wechat_openid = ?` |

---

## 三、数据库模型扩展设计 (Schema Extension)

在 `packages/base/db-control/prisma/schema.prisma` 的 `TenantAccount` 模型中，进行如下增量字段扩展：

```prisma
/// 租户企业私有凭据表 (Tenant-Scoped Account)
model TenantAccount {
  /// 凭据记录主键 ID (UUIDv7)
  id             String       @id @default(uuid(7)) @db.Uuid
  /// 所属租户企业 ID
  organizationId String       @map("organization_id") @db.Uuid

  /// 1. 原生基础凭据
  account        String       @db.VarChar(64)  // 登录账号 (工号/字母/手机号)
  password       String       @db.VarChar(255) // 私有加盐 Scrypt 密码哈希
  name           String       @db.VarChar(100) // 员工姓名快照
  memberId       String?      @map("member_id") @db.Uuid

  /// 2. 扩展 OAuth 字段 (全部受限于 organizationId 租户命名空间)
  /// 企业绑定的微信/公众号 OpenID (当前企业独立)
  wechatOpenid   String?      @map("wechat_openid") @db.VarChar(128)
  /// 企业微信自建应用员工 UserId
  workWechatUid  String?      @map("work_wechat_uid") @db.VarChar(128)
  /// 钉钉组织内员工 UnionId / UserId
  dingtalkUid    String?      @map("dingtalk_uid") @db.VarChar(128)

  /// 凭据状态: ACTIVE(在职启用) / DISABLED(停用离职)
  status         String       @default("ACTIVE") @db.VarChar(20)
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // 复合唯一索引：确保每种凭证在当前企业内部唯一，绝不跨租户冲突
  @@unique([organizationId, account])
  @@unique([organizationId, wechatOpenid])
  @@unique([organizationId, workWechatUid])
  @@unique([organizationId, dingtalkUid])

  @@index([organizationId])
  @@index([memberId])
  @@map("tenant_account")
}
```

---

## 四、Better Auth 原生接入机制与完整时序

无论员工是通过账号密码还是微信扫码，其**底层签发标准会话的管道 100% 走 Better Auth 官方原生机制**。

### 核心插件实现结构 (`tenantCredentialsPlugin.ts`)

```typescript
export const tenantOAuthPlugin = () => {
  return {
    id: "tenant-oauth",
    endpoints: {
      /**
       * 租户专属微信扫码验证与登录端点
       * POST /api/auth/sign-in/tenant-wechat
       */
      signInTenantWechat: createAuthEndpoint(
        "/sign-in/tenant-wechat",
        {
          method: "POST",
          body: z.object({
            organizationSlug: z.string(),
            wechatOpenid: z.string(),
            rememberMe: z.boolean().optional(),
          }),
        },
        async (ctx) => {
          const { organizationSlug, wechatOpenid, rememberMe } = ctx.body;

          // 1. 根据企业 Slug 锁定唯一组织
          const org = await prisma.organization.findUnique({
            where: { slug: organizationSlug },
            select: { id: true, name: true },
          });
          if (!org) throw new APIError("UNAUTHORIZED", { message: "企业编码无效" });

          // 2. 租户物理隔离门禁：精确查当前企业的 tenant_account
          const tenantAccount = await prisma.tenantAccount.findUnique({
            where: {
              organizationId_wechatOpenid: {
                organizationId: org.id,
                wechatOpenid,
              },
            },
            include: { organization: true },
          });

          // 3. 严格在职状态门禁拦截
          if (!tenantAccount) {
            throw new APIError("UNAUTHORIZED", { message: "当前微信未绑定该企业员工，请先在电脑端绑定" });
          }
          if (tenantAccount.status !== "ACTIVE") {
            throw new APIError("FORBIDDEN", { message: "该员工账号已停用，禁止登录" });
          }

          // 4. 定位该员工对应的平台 User.id
          const member = await prisma.member.findUnique({
            where: { id: tenantAccount.memberId! },
            select: { userId: true },
          });
          const userId = member!.userId;

          // 5. 【调用 Better Auth 官方原生内部适配器生成 Session】
          const session = await ctx.context.internalAdapter.createSession(
            userId,
            rememberMe === false,
          );

          // 6. 将当前操作组织原子更新至 Session
          await prisma.session.update({
            where: { id: session.id },
            data: { activeOrganizationId: org.id },
          });

          const user = await ctx.context.internalAdapter.findUserById(userId);

          // 7. 【调用 Better Auth 官方 setSessionCookie 原生种植 HttpOnly Cookie】
          await setSessionCookie(ctx, { session, user: user! }, rememberMe === false);

          return ctx.json({
            success: true,
            token: session.token,
            organizationId: org.id,
            account: tenantAccount.account,
            name: tenantAccount.name,
          });
        }
      ),
    },
  };
};
```

---

## 五、双核心业务场景实现细节

### 场景 1：日常扫码直登 (Zero-Friction Login)
1. 员工打开 `chenrun.saas.com` 或输入企业代号 `chenrun`；
2. 页面展示当前企业的专属带参二维码（内置 `state` 与 `chenrun` 标识）；
3. 员工使用手机微信扫码授权；
4. 微信开放平台将 `openid` 回调至后端，后端执行上述 `signInTenantWechat` 端点；
5. **无需二次输入任何密码，0.5 秒直接签发 Better Auth Session 并自动重定向至工作台**。

### 场景 2：首次绑定微信 (Self-Service Association)
有两种企业常用的绑定流转方式：
- **方式 A（登录页扫码引导绑定）**：
  员工扫码后，系统发现该 `openid` 尚未登记在 `chenrun` 的 `tenant_account` 中，前端立即就地弹出弹窗：“请验证您的工号与密码以完成微信绑定”。输入正确后原子写入 `wechatOpenid`。
- **方式 B（工作台个人中心绑定）**：
  员工在已登录的工作台右上角点击“个人设置” -> “绑定微信”，屏幕弹出绑定二维码，扫码成功后直接将该微信号写入当前员工的 `tenant_account` 记录。

---

## 六、企业级安全与离职阻断铁律

1. **一键离职安全熔断 (Instant Kill-Switch)**：
   - 当 HR 在「员工管理」将员工设为离职或禁用时，服务层只需将 `tenant_account.status = "DISABLED"`，并清空 `wechatOpenid`；
   - 随后的下一次请求，无论是凭借原本存留的 Cookie，还是再次扫码，门禁会在**连接租户物理业务库之前直接 403 阻断**；
2. **多企业身份绝不混淆 (Multi-Tenant Isolation)**：
   - 即使同一个员工用同一个微信在 A 公司（辰润）和 B 公司（好味道）都绑了账号；
   - 只要扫码时识别的前端域名/企业标识不同，系统只会精确匹配对应企业的 `tenant_account`，绝对不会发生窜门或数据越界。
