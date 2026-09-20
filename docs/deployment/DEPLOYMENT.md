# 宸润数智 ERP 生产部署实战指南 (Docker Compose & Day 0 初始化)

本文档面向运维工程师与系统管理员，详细阐明基于 **Docker Compose 生产容器编排** 的标准化部署交付流程，以及系统首次上线的 **Day 0 自动化数据初始化** 与 **内网穿透 / 域名白名单** 配置规范。

系统整体架构与切片设计请参阅：[《系统整体架构白皮书》(`docs/ARCHITECTURE.md`)](../ARCHITECTURE.md)。

---

## 一、 部署形态与发布策略

本项目采用 **自托管 Docker Compose 一键式交付** 模式：

```text
[本地开发/构建机]
   │
   ├── 1. 运行交互式打包: pnpm docker:build (支持选择目标架构 amd64/arm64)
   ├── 2. 自动构建镜像并压缩为: app-images.tar.gz
   └── 3. 上传镜像包与编排文件至目标服务器 (SCP / SFTP / 堡垒机)
            │
            ▼
[生产宿主机环境]
   ├── 4. 解压载入镜像: gunzip -c app-images.tar.gz | docker load
   ├── 5. 准备 apps/control/.env.local 与 apps/tenant/.env.local
   └── 6. 一键启动服务集群: docker compose -f compose.prod.yaml up -d
            │
            ▼ (服务首次启动全自动执行 Day 0 初始化)
         • 容器启动自动探查 PostgreSQL 数据库连通性
         • 自动判定平台总控库为空库，事务级加锁执行 Baseline 建表
         • 自动通过环境变量注入初始超管账号 (密码 Scrypt 加盐)
         • 自动就绪并对外提供服务，全程无需运维手动敲 SQL 或临时容器命令
```

---

## 二、 第一步：本地镜像交互式构建与打包

在本地开发机根目录下执行命令即可完成打包：

### 1. 运行交互式构建脚本

```bash
pnpm docker:build
```

根据终端交互提示进行选择：
1. **选择目标服务器架构**：
   - 输入 `1`：`linux/amd64`（**推荐**，适用于绝大部分主流云服务器，如阿里云、腾讯云、华为云等 x86 实例）；
   - 输入 `2`：`linux/arm64`（适用于 ARM 架构服务器，如华为鲲鹏、飞腾、苹果 M 芯片、AWS Graviton）；
   - 输入 `3`：当前系统本地架构（不指定 platform，使用本地 Docker 架构）。
2. **选择构建目标**：
   - 输入 `1`：全部构建（`base-control` 平台管控端 + `base-tenant` 租户业务端）；
3. **选择是否压缩导出**：
   - 默认回车或输入 `y`：构建完成后自动调用 Node.js 流式压缩为 `app-images.tar.gz`。

### 2. 将部署文件上传至生产服务器

假设生产服务器部署目录为 `/opt/saas-erp`：

```bash
# 1. 在本地终端上传镜像压缩包与生产编排文件
scp app-images.tar.gz user@your-server-ip:/opt/saas-erp/
scp compose.prod.yaml user@your-server-ip:/opt/saas-erp/
```

---

## 三、 第二步：生产服务器环境准备与配置

登录生产服务器（`cd /opt/saas-erp`），执行以下步骤：

### 1. 解压载入 Docker 镜像

```bash
cd /opt/saas-erp
gunzip -c app-images.tar.gz | docker load
```

执行 `docker images` 可验证镜像已成功加载：
- `base-control:latest`
- `base-tenant:latest`

### 2. 创建应用配置目录

```bash
mkdir -p apps/control apps/tenant
```

### 3. 配置平台管控端环境变量 (`apps/control/.env.local`)

创建并编辑 `/opt/saas-erp/apps/control/.env.local`：

```env
# 1. Better Auth 认证密钥 (必须 >= 32 字符，可用 openssl rand -base64 32 生成)
BETTER_AUTH_SECRET="your-production-control-secret-at-least-32-chars-long"

# 2. 外部访问管控端的完整 URL (若通过穿透/域名访问，填真实公网地址)
BETTER_AUTH_URL="https://control.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://control.yourdomain.com"

# 3. 平台超级管理员邮箱白名单 (登录账号必须在此列表中)
CONTROL_ADMIN_EMAILS="admin@example.com"

# 4. Day 0 平台超管自动初始化凭证 (首次启动自动写入平台数据库)
CONTROL_BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
CONTROL_BOOTSTRAP_ADMIN_NAME="系统总控超级管理员"
CONTROL_BOOTSTRAP_ADMIN_PASSWORD="YourStrongPassword123!"

# 5. 外网穿透 / 跨域 / 访问来源白名单 (支持多个用逗号隔开，支持 *.yourdomain.com)
ALLOWED_ORIGINS="control.yourdomain.com,*.yourdomain.com"

PORT=3001
```

### 4. 配置租户业务端环境变量 (`apps/tenant/.env.local`)

创建并编辑 `/opt/saas-erp/apps/tenant/.env.local`：

```env
# 1. Better Auth 认证密钥 (必须 >= 32 字符)
BETTER_AUTH_SECRET="your-production-tenant-secret-at-least-32-chars-long"

# 2. 外部访问租户端的完整 URL (若通过穿透/域名访问，填真实公网地址)
BETTER_AUTH_URL="https://app.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://app.yourdomain.com"

# 3. 外网穿透 / 跨域 / 访问来源白名单 (支持多个用逗号隔开，支持 *.yourdomain.com)
ALLOWED_ORIGINS="app.yourdomain.com,*.yourdomain.com"

PORT=3000
```

---

## 四、 第三步：一键启动集群与自动化 Day 0

在 `/opt/saas-erp` 目录下，直接运行：

```bash
docker compose -f compose.prod.yaml up -d
```

### 自动化流水线流转过程

```text
运维执行: docker compose -f compose.prod.yaml up -d
    │
    ├── 1. [postgres-control] 容器启动并健康就绪 (pg_isready 检查通过)
    │
    ├── 2. [control-app] 容器启动并自动执行初始化：
    │      • 自动嗅探 CONTROL_DATABASE_URL 连通性
    │      • 发现为空库，开启事务并获取事务级咨询锁 (pg_advisory_xact_lock)
    │      • 自动灌装 Baseline SQL (用户表、租户物理库元数据表等)
    │      • 读取 CONTROL_BOOTSTRAP_ADMIN_*，使用 Scrypt 算法初始化超管账号
    │      • 完成后自动拉起 Next.js 生产 standalone 服务进程 (端口 3001)
    │
    └── 3. [tenant-app] 依赖 control-app 就绪后启动并提供服务 (端口 3000)
```

### 检查服务运行状态

```bash
# 查看所有容器运行状态 (必须全为 Up / healthy)
docker compose -f compose.prod.yaml ps

# 查看管控端启动与 Day 0 建表日志
docker compose -f compose.prod.yaml logs -f control-app
```

---

## 五、 第四步：内网穿透与外网访问配置

如果你的服务器没有公网 IP，通过内网穿透（如 cpolar, frp, nginx, cloudflare tunnel）暴露给外网：

1. **端口映射规划**：
   - **平台管控端 (Control)**：将外网域名（如 `control.yourdomain.com`）指向宿主机 **`3001`** 端口；
   - **租户业务端 (Tenant)**：将外网域名（如 `app.yourdomain.com`）指向宿主机 **`3000`** 端口；
   - **数据库 (PostgreSQL 5432)**：已安全绑定在宿主机本地，容器间通过 Docker 内部网络通信，**严禁穿透到外网**。

2. **内网穿透/反向代理 Host 透传注意事项**：
   - 必须确保穿透或反向代理保留原始请求头：
     - `Host`: 客户端实际访问的主机名（如 `control.yourdomain.com`）；
     - `X-Forwarded-Proto`: 客户端访问协议（`http` 或 `https`）；
     - `X-Forwarded-For`: 客户端原始 IP。

---

## 六、 第五步：登录验证与首批租户开通

1. **登录平台管控中心**：
   - 打开浏览器访问：`https://control.yourdomain.com/login`
   - 使用在 `apps/control/.env.local` 中填写的 `CONTROL_BOOTSTRAP_ADMIN_EMAIL` 和 `CONTROL_BOOTSTRAP_ADMIN_PASSWORD` 登录进入总控中枢。

2. **动态开辟企业租户 (Tenant Day 0)**：
   - 进入管控后台的 **【租户管理】** 菜单；
   - 点击 **【开通新租户】**，填写租户企业名称、代码、管理员邮箱与密码；
   - 提交后，平台引擎将全自动在 PostgreSQL 中开辟对应的租户独立物理数据库，加锁灌装业务全量表与组织架构种子数据；
   - 开通完成后，用户即可在 `https://app.yourdomain.com/login` 使用该租户账号直接登录业务系统。

---

## 七、 常见问题排查与运维命令

| 场景 | 排查与处置方式 |
| :--- | :--- |
| **外网访问提示跨域或来源被拒绝** | 检查 `apps/control/.env.local` 和 `apps/tenant/.env.local` 中的 `ALLOWED_ORIGINS` 是否包含了外网访问的域名/IP，改完后执行 `docker compose -f compose.prod.yaml restart`。 |
| **登录跳回 localhost 或 Cookie 失效** | 检查 `.env.local` 中的 `BETTER_AUTH_URL` 是否已配置为真实外网域名，确保以 `http://` 或 `https://` 开头。 |
| **重新初始化平台总控库** | 执行 `docker compose -f compose.prod.yaml down -v`（**警告：会清除数据库数据卷**），再次 `up -d` 即可全自动重新建表与初始化超管。 |
| **查看特定容器实时日志** | `docker compose -f compose.prod.yaml logs -f control-app` 或 `tenant-app`。 |
