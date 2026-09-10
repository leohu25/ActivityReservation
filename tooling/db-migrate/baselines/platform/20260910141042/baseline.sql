-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantDatabaseStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TenantMigrationStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLED_BACK');

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviter_id" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "authorization_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_role" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "organization_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "active_organization_id" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_database" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "cluster_code" TEXT NOT NULL,
    "database_name" TEXT NOT NULL,
    "secret_ref" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "status" "TenantDatabaseStatus" NOT NULL DEFAULT 'PROVISIONING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_migration" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "migration_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "batch_id" TEXT,
    "status" "TenantMigrationStatus" NOT NULL DEFAULT 'PENDING',
    "applied_steps" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "execution_time_ms" INTEGER,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_migration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "invitation_organization_id_idx" ON "invitation"("organization_id");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "member_user_id_idx" ON "member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_organization_id_user_id_key" ON "member"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_role_organization_id_idx" ON "organization_role"("organization_id");

-- CreateIndex
CREATE INDEX "organization_role_role_idx" ON "organization_role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_organization_id_role_key" ON "organization_role"("organization_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_active_organization_id_idx" ON "session"("active_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_database_organization_id_key" ON "tenant_database"("organization_id");

-- CreateIndex
CREATE INDEX "tenant_database_cluster_code_status_idx" ON "tenant_database"("cluster_code", "status");

-- CreateIndex
CREATE INDEX "tenant_migration_organization_id_idx" ON "tenant_migration"("organization_id");

-- CreateIndex
CREATE INDEX "tenant_migration_status_idx" ON "tenant_migration"("status");

-- CreateIndex
CREATE INDEX "tenant_migration_batch_id_idx" ON "tenant_migration"("batch_id");

-- CreateIndex
CREATE INDEX "tenant_migration_organization_id_version_idx" ON "tenant_migration"("organization_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role" ADD CONSTRAINT "organization_role_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_database" ADD CONSTRAINT "tenant_database_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_migration" ADD CONSTRAINT "tenant_migration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database Comments
COMMENT ON TABLE "account" IS '第三方或本地账号绑定信息表 (Better Auth Account)';
COMMENT ON COLUMN "account"."id" IS '绑定账号唯一记录ID';
COMMENT ON COLUMN "account"."account_id" IS '供应商侧的用户唯一ID (如微信openid/OAuth sub)';
COMMENT ON COLUMN "account"."provider_id" IS '身份凭据提供方类型 (如 credential, github 等)';
COMMENT ON COLUMN "account"."user_id" IS '关联平台用户主键ID';
COMMENT ON COLUMN "account"."access_token" IS 'OAuth 访问令牌';
COMMENT ON COLUMN "account"."refresh_token" IS 'OAuth 刷新令牌';
COMMENT ON COLUMN "account"."id_token" IS 'OIDC 身份令牌';
COMMENT ON COLUMN "account"."access_token_expires_at" IS '访问令牌过期时间';
COMMENT ON COLUMN "account"."refresh_token_expires_at" IS '刷新令牌过期时间';
COMMENT ON COLUMN "account"."scope" IS 'OAuth 授权作用域';
COMMENT ON COLUMN "account"."password" IS '哈希加密后的本地密码凭据';
COMMENT ON COLUMN "account"."created_at" IS '记录绑定时间';
COMMENT ON COLUMN "account"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "invitation" IS '租户邀请记录表';
COMMENT ON COLUMN "invitation"."id" IS '邀请记录ID';
COMMENT ON COLUMN "invitation"."organization_id" IS '目标租户企业ID';
COMMENT ON COLUMN "invitation"."email" IS '受邀人邮箱地址';
COMMENT ON COLUMN "invitation"."role" IS '预分配角色';
COMMENT ON COLUMN "invitation"."status" IS '邀请状态: pending / accepted / rejected / canceled';
COMMENT ON COLUMN "invitation"."expires_at" IS '邀请链接有效期截止时间';
COMMENT ON COLUMN "invitation"."created_at" IS '发起邀请时间';
COMMENT ON COLUMN "invitation"."inviter_id" IS '邀请人用户ID';
COMMENT ON TABLE "member" IS '租户企业成员归属表 (关联 User 与 Organization)';
COMMENT ON COLUMN "member"."id" IS '成员记录ID';
COMMENT ON COLUMN "member"."organization_id" IS '所属租户企业ID';
COMMENT ON COLUMN "member"."user_id" IS '平台用户ID';
COMMENT ON COLUMN "member"."role" IS '成员角色 (owner / admin / member)';
COMMENT ON COLUMN "member"."created_at" IS '加入企业时间';
COMMENT ON TABLE "organization" IS '平台租户企业空间表 (Organization)';
COMMENT ON COLUMN "organization"."id" IS '租户企业唯一ID';
COMMENT ON COLUMN "organization"."name" IS '租户企业全称';
COMMENT ON COLUMN "organization"."slug" IS '租户英文代号 (Subdomain/Slug)';
COMMENT ON COLUMN "organization"."logo" IS '企业徽标 Logo URL';
COMMENT ON COLUMN "organization"."created_at" IS '企业入驻创建时间';
COMMENT ON COLUMN "organization"."metadata" IS '扩展元数据 (JSON)';
COMMENT ON COLUMN "organization"."authorization_version" IS '权限版本号 (CASL 缓存失效基准)';
COMMENT ON TABLE "organization_role" IS '企业自定义权限角色表';
COMMENT ON COLUMN "organization_role"."id" IS '角色主键ID';
COMMENT ON COLUMN "organization_role"."organization_id" IS '归属租户企业ID';
COMMENT ON COLUMN "organization_role"."role" IS '角色代号';
COMMENT ON COLUMN "organization_role"."permission" IS 'CASL 声明权限策略 JSON';
COMMENT ON COLUMN "organization_role"."created_at" IS '角色创建时间';
COMMENT ON COLUMN "organization_role"."updated_at" IS '角色最后更新时间';
COMMENT ON TABLE "session" IS '用户认证会话表 (Better Auth Session)';
COMMENT ON COLUMN "session"."id" IS '会话唯一ID';
COMMENT ON COLUMN "session"."expires_at" IS '会话过期时间戳';
COMMENT ON COLUMN "session"."token" IS '会话安全令牌 Token';
COMMENT ON COLUMN "session"."created_at" IS '会话建立时间';
COMMENT ON COLUMN "session"."updated_at" IS '会话更新时间';
COMMENT ON COLUMN "session"."ip_address" IS '客户端 IP 地址';
COMMENT ON COLUMN "session"."user_agent" IS '客户端 User-Agent';
COMMENT ON COLUMN "session"."user_id" IS '关联用户主键ID';
COMMENT ON COLUMN "session"."active_organization_id" IS '当前处于激活上下文的租户企业ID';
COMMENT ON TABLE "tenant_database" IS '租户物理独立数据库路由事实源 (Database-per-tenant 拓扑总账)';
COMMENT ON COLUMN "tenant_database"."id" IS '数据库拓扑记录ID';
COMMENT ON COLUMN "tenant_database"."organization_id" IS '关联租户企业ID (1:1 物理隔离绑定)';
COMMENT ON COLUMN "tenant_database"."cluster_code" IS '所在物理集群代号 (如 pg-cluster-sh-01)';
COMMENT ON COLUMN "tenant_database"."database_name" IS '独立物理数据库名 (如 tenant_xxx)';
COMMENT ON COLUMN "tenant_database"."secret_ref" IS '连接凭据密钥引用标识';
COMMENT ON COLUMN "tenant_database"."schema_version" IS '当前物理库已应用的最新 Schema 版本号';
COMMENT ON COLUMN "tenant_database"."status" IS '数据库生命周期状态: PROVISIONING / ACTIVE / SUSPENDED / FAILED';
COMMENT ON COLUMN "tenant_database"."created_at" IS '数据库开通分配时间';
COMMENT ON COLUMN "tenant_database"."updated_at" IS '拓扑信息更新时间';
COMMENT ON TABLE "tenant_migration" IS '租户数据库版本演进与增量迁移执行台账';
COMMENT ON COLUMN "tenant_migration"."id" IS '迁移执行记录ID';
COMMENT ON COLUMN "tenant_migration"."organization_id" IS '目标租户企业ID';
COMMENT ON COLUMN "tenant_migration"."migration_name" IS '迁移名称';
COMMENT ON COLUMN "tenant_migration"."version" IS '迁移版本时间戳';
COMMENT ON COLUMN "tenant_migration"."batch_id" IS '所属批量发布批次ID';
COMMENT ON COLUMN "tenant_migration"."status" IS '当前迁移执行状态';
COMMENT ON COLUMN "tenant_migration"."applied_steps" IS '已执行完成的 Step 数';
COMMENT ON COLUMN "tenant_migration"."error_message" IS '失败异常信息详情';
COMMENT ON COLUMN "tenant_migration"."execution_time_ms" IS '物理执行耗时 (毫秒)';
COMMENT ON COLUMN "tenant_migration"."started_at" IS '执行开始时间戳';
COMMENT ON COLUMN "tenant_migration"."finished_at" IS '执行结束时间戳';
COMMENT ON COLUMN "tenant_migration"."created_at" IS '任务创建时间';
COMMENT ON COLUMN "tenant_migration"."updated_at" IS '任务更新时间';
COMMENT ON TABLE "user" IS '平台用户账号表 (Better Auth 核心认证主体)';
COMMENT ON COLUMN "user"."id" IS '用户全局唯一标识 UUID';
COMMENT ON COLUMN "user"."name" IS '用户姓名或称谓';
COMMENT ON COLUMN "user"."email" IS '用户登录邮箱 (唯一)';
COMMENT ON COLUMN "user"."email_verified" IS '邮箱是否已通过验证';
COMMENT ON COLUMN "user"."image" IS '用户头像 URL';
COMMENT ON COLUMN "user"."created_at" IS '注册创建时间';
COMMENT ON COLUMN "user"."updated_at" IS '资料最后更新时间';
COMMENT ON TABLE "verification" IS '安全验证凭据表 (邮箱激活/重置密码验证码)';
COMMENT ON COLUMN "verification"."id" IS '验证记录ID';
COMMENT ON COLUMN "verification"."identifier" IS '验证标识 (如邮箱地址/手机号)';
COMMENT ON COLUMN "verification"."value" IS '动态验证码或加密令牌哈希';
COMMENT ON COLUMN "verification"."expires_at" IS '验证码有效截止时间';
COMMENT ON COLUMN "verification"."created_at" IS '生成发送时间';
COMMENT ON COLUMN "verification"."updated_at" IS '更新时间';
