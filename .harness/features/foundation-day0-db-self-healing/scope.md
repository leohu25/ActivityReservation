# Scope 白名单: foundation-day0-db-self-healing

## 允许修改/新增的文件范围

- `feature_list.json`
- `member.local.md`
- `package.json`
- `pnpm-lock.yaml`
- `init.sh`
- `.harness/features/foundation-day0-db-self-healing/**`
- `tooling/db-migrate/**`
- `packages/db-control/**`
- `packages/db-tenant/**`
- `packages/auth/**`
- `packages/features/control-admin/**`
- `apps/control/**`
- `apps/tenant/**`
- `scripts/**`
- `compose.prod.yaml`
- `compose.yaml`
- `.dockerignore`
- `README.md`
- `docs/**`

## 附带修改与前置联动 (Spillover / 联动扩围)

- `compose.prod.yaml` # 理由：生产级 Docker Compose 编排与 Day 0 启动闭环
- `compose.yaml` # 理由：删除无用的废弃 compose 配置文件
- `.dockerignore` # 理由：生产 Docker 镜像构建排除项
- `README.md` # 理由：更新项目快速上手、Day 0 命令与部署文档索引
- `docs/ARCHITECTURE.md` # 理由：新建系统整体架构白皮书
- `docs/DEPLOYMENT.md` # 理由：新建生产与多环境部署实战指南
- `packages/features/README.md` # 理由：各包 README 自解释完善
- `packages/features/customer-center/README.md` # 理由：各包 README 自解释完善
- `packages/features/procurement-center/README.md` # 理由：各包 README 自解释完善
- `packages/features/tenant-admin/README.md` # 理由：各包 README 自解释完善
- `packages/shared/README.md` # 理由：各包 README 自解释完善
- `packages/ui/README.md` # 理由：各包 README 自解释完善

## 范围说明

- 允许扩展迁移运行时、数据库客户端创建门禁、启动脚本与对应测试。
- 允许为平台 Bootstrap 超管增加环境变量模板和认证兼容的 Seed。
- 不修改无关业务切片业务逻辑，不引入生产运行时 Prisma CLI 依赖。

## 严禁修改

- 禁止对非空残缺库自动执行 Baseline 或差异 DDL。
- 禁止在应用请求中捕获 Prisma `P2021` 后临时补表。
- 禁止硬编码生产超管密码或在日志中输出 Secret/连接串。
