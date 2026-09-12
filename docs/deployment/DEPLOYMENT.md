# 宸润数智 ERP 部署实战指南 (Docker Compose & Day 0 初始化)

本文档面向运维工程师与系统管理员，专门阐明基于 **Docker Compose（本地构建镜像 + 手动导出/上传部署）** 的生产环境标准化交付流程，以及 **Day 0（从 0 到 1 首次上线）** 的详细数据初始化规范。

系统整体设计与业务切片拓扑请参阅：[《系统整体架构白皮书》(`docs/ARCHITECTURE.md`)](../ARCHITECTURE.md)。

---

## 一、 部署形态与发布策略

本项目采用 **自托管 Docker Compose 一键式交付** 模式：

```text
[本地开发/构建机]
   │
   ├── 1. 构建独立镜像: chenrun-control:latest & chenrun-tenant:latest
   ├── 2. 导出 tar 归档: docker save ... | gzip > images.tar.gz
   └── 3. 手动上传至目标宿主机 (SCP / SFTP / 堡垒机)
            │
            ▼
[生产宿主机环境 (全自动零触碰启动)]
   ├── 4. 导入镜像: docker load < images.tar.gz
   ├── 5. 准备 compose.prod.yaml 与生产 .env 环境变量
   └── 6. 一键启动服务集群: docker compose -f compose.prod.yaml up -d
            │
            ▼ (容器内部/服务启动时全自动完成 Day 0)
         • 自动探查数据库连通性
         • 自动判定平台库为空库，事务级加锁执行 Baseline 建表
         • 自动通过环境变量注入初始超管账号 (密码 Scrypt 加盐)
         • 自动就绪并对外提供服务，全程无需运维手动敲 SQL 或临时容器命令
```

---

## 二、 生产镜像本地打包流程

在本地机器执行构建前，请确保代码库工作区干净并通过全量类型检查（`pnpm check`）。

### 1. 镜像构建命令

在 Monorepo 根目录下执行：

```bash
# 1. 构建平台管控端镜像 (Control Admin)
docker build -t chenrun-control:latest -f apps/control/Dockerfile .

# 2. 构建租户业务端镜像 (Tenant SaaS)
docker build -t chenrun-tenant:latest -f apps/tenant/Dockerfile .
```

### 2. 镜像归档打包与上传

```bash
# 本地导出压缩镜像包
docker save chenrun-control:latest chenrun-tenant:latest | gzip > chenrun-erp-images.tar.gz

# 上传至生产服务器指定目录 (例如 /opt/chenrun-erp)
scp chenrun-erp-images.tar.gz user@prod-server:/opt/chenrun-erp/
```

---

## 三、 生产服务器环境准备

在生产服务器（`/opt/chenrun-erp`）就位：

### 1. 导入镜像

```bash
cd /opt/chenrun-erp
gunzip -c chenrun-erp-images.tar.gz | docker load
```

### 2. 生产环境变量配置 (`.env.production`)

在生产服务器上创建受控的 `.env.production`，严格配置凭证（严禁泄露）：

```env
# ==========================================
# 1. 平台管控库 (Control DB - saas_control)
# ==========================================
CONTROL_DATABASE_URL="postgresql://chenrun_prod_user:StrongPasswordHere@postgres-control:5432/saas_control?schema=public"

# ==========================================
# 2. Better Auth 生产安全秘钥 (需 >= 32 字符，由 openssl rand -base64 32 生成)
# ==========================================
BETTER_AUTH_SECRET="your-production-high-entropy-auth-secret-at-least-32-chars-long"
BETTER_AUTH_URL="https://control.yourdomain.com"

# ==========================================
# 3. 平台超级管理员授权白名单与 Day 0 凭据 (必填)
# ==========================================
# 授权白名单 (逗号分隔)
CONTROL_ADMIN_EMAILS="superadmin@yourcompany.com"

# Day 0 首次空库建表时自动初始化的超管凭据 (必须与白名单对齐)
CONTROL_BOOTSTRAP_ADMIN_EMAIL="superadmin@yourcompany.com"
CONTROL_BOOTSTRAP_ADMIN_NAME="系统总控超级管理员"
CONTROL_BOOTSTRAP_ADMIN_PASSWORD="YourInitialBootstrapPassword999!"

# ==========================================
# 4. 租户端运行时配置
# ==========================================
NEXT_PUBLIC_APP_URL="https://app.yourdomain.com"
PORT=3000
```

---

## 四、 Day 0 自动化初始化流程 (全自动零触碰启动)

在 Docker Compose 生产交付模式下，**Day 0 初始化完全由容器启动脚本（Entrypoint）或 Compose 依赖编排全自动触发并完成，运维人员只需一键 `docker compose up -d`，不需要任何手动敲命令初始化！**

### 1. 自动化流水线流转模型

```text
运维执行: docker compose -f compose.prod.yaml up -d
    │
    ├── [postgres-control] 容器启动并就绪 (健康检查通过: pg_isready)
    │
    ▼
[control-app] 容器拉起 (启动命令自动执行: pnpm db:platform:ensure && next start)
    │
    ├── 1. 自动嗅探 CONTROL_DATABASE_URL 连通性 (若数据库未就绪则自动重试等待)
    ├── 2. 自动 Ledger-First 探查:
    │      • 发现 platform_migration 账本不存在且无业务核心表 -> 判定为 Day 0 全新空库
    ├── 3. 自动加锁与建表:
    │      • 开启事务并获取事务级咨询锁 (pg_advisory_xact_lock)
    │      • 自动灌装预编译 Baseline SQL (涵盖 user, session, organization, tenant_database 等全量表)
    │      • 自动登记 baseline 账本版本 20260910141042 与 SHA-256 Checksum
    ├── 4. 自动注入超管 (Seed):
    │      • 读取 CONTROL_BOOTSTRAP_ADMIN_* 环境变量
    │      • 自动使用 Better Auth 原生 Scrypt 算法哈希密码并存入 user 和 account 表
    ├── 5. 提交事务，输出: Initialized platform database baseline 20260910141042
    │
    ▼
自动无缝切换启动 Next.js 生产服务进程 (exec next start -p 3001)
    │
    ▼
全栈就绪！超管即可打开浏览器登录总控后台。
```

---

### 2. 生产 Docker Compose 编排模板 (`compose.prod.yaml`)

生产环境的 `compose.prod.yaml` 推荐配置如下，它利用 Docker 原生健康检查与启动前置命令，实现全自动的 Day 0 自愈：

```yaml
version: "3.8"

services:
  # 1. 平台管控库 (PostgreSQL 17)
  postgres-control:
    image: postgres:17-alpine
    container_name: chenrun-prod-postgres-control
    restart: always
    environment:
      POSTGRES_DB: saas_control
      POSTGRES_USER: chenrun_prod_user
      POSTGRES_PASSWORD: StrongProductionPassword123!
    volumes:
      - postgres_control_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chenrun_prod_user -d saas_control"]
      interval: 3s
      timeout: 3s
      retries: 10

  # 2. 平台总控端 Web 服务 (Control Admin)
  control-app:
    image: chenrun-control:latest
    container_name: chenrun-prod-control
    restart: always
    depends_on:
      postgres-control:
        condition: service_healthy
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    # 核心：启动前自动执行 ensure，检测空库则自动建表+种超管，完成后自动切入 next start
    command: >
      sh -c "pnpm db:platform:ensure && exec pnpm --filter control start"

  # 3. 租户业务端 Web 服务 (Tenant SaaS)
  tenant-app:
    image: chenrun-tenant:latest
    container_name: chenrun-prod-tenant
    restart: always
    depends_on:
      - control-app
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    command: >
      pnpm --filter tenant start

volumes:
  postgres_control_data:
    name: chenrun_prod_postgres_control_data
```

---

### 3. 首批租户物理库初始化 (Tenant Day 0)

平台控制库自动就绪后，企业租户的物理库采用**平台控制面按需动态自动化开辟**（无需运维去数据库敲 `CREATE DATABASE`）：

1. 超管登录控制台后台（`https://control.yourdomain.com/tenants`）；
2. 点击 **【开通新租户】 (Provision Tenant)**，输入企业名称（如 `系统工业`）、Slug 代号（如 `chenrun-ind`）、Owner 邮箱与密码；
3. 点击提交，后台引擎（`TenantDatabaseProvisioner`）全自动执行：
   - 物理创建数据库 `tenant_chenrun_ind`；
   - 加锁并自动执行租户端最新全量 Baseline SQL（部门、岗位、员工、采购、客户、报价单等）；
   - 自动填充初始种子数据（ROOT 根部门、3 大默认岗位、Owner 初始员工档案并指派总经理岗位）；
   - 写入本地迁移账本 `tenant_schema_migration`，状态自动翻转为 `ACTIVE`；
4. 租户企业即可直接登录使用。

---

## 五、 生产运维与异常处置规程

### 1. 增量升级 (Day 1+)

当业务迭代产生新的增量迁移时：

- 严禁直接修改已发布的 Baseline 文件；
- 使用 `pnpm db:migrate:generate` 生成标准的增量 SQL 并通过 Git 审查；
- 生产更新前，执行独立迁移命令：

  ```bash
  pnpm --filter @base/db-migrate db-migrate catalog
  ```

- 平台端增量升级通过管理后台 `/migrations` 中枢或独立运维任务触发；
- 各租户库升级由平台中枢按批次进行灰度发布或一键全量升级，全程受 Advisory Lock 互斥保护。

### 2. 数据库残缺/损坏处理 (Fail-Closed 处置)

若部署命令报错 `DATABASE_PARTIAL`：

- **原因**：数据库非空，缺少核心表或缺少迁移账本（疑似手动删表或初始化中断）。
- **处置原则**：系统已严格拦截，禁止自动补表篡改数据。运维人员必须连入数据库，人工排查表残留情况，或在确保无有效数据后执行 `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` 重置为空库，再重新执行 `ensure-platform`。

### 3. Checksum 校验冲突 (`BASELINE_CHECKSUM_MISMATCH`)

- **原因**：已执行基线的 SHA-256 校验和与当前镜像中的代码不一致（迁移文件被违规篡改）。
- **处置原则**：严禁强行忽略。排查是否拉取了错误版本的镜像，或回退至正确的代码提交。
