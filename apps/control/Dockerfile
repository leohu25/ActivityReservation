# ==============================================================================
# 平台管控端 (Control Admin) 生产多阶段构建 Dockerfile
# 基于 Next.js 官方推荐 standalone 模式与轻量生产运行镜像
# Monorepo 根上下文构建: docker build -t base-control:latest -f apps/control/Dockerfile .
# ==============================================================================

# 1. 基础环境
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

# 2. 依赖安装阶段
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/control/package.json ./apps/control/
COPY packages/base/auth/package.json ./packages/base/auth/
COPY packages/base/authorization/package.json ./packages/base/authorization/
COPY packages/base/db-control/package.json ./packages/base/db-control/
COPY packages/base/db-tenant/package.json ./packages/base/db-tenant/
COPY packages/base/shared/package.json ./packages/base/shared/
COPY packages/base/ui/package.json ./packages/base/ui/
COPY packages/base/biz-shared/package.json ./packages/base/biz-shared/
COPY packages/platform/control-admin/package.json ./packages/platform/control-admin/
COPY packages/platform/tenant-admin/package.json ./packages/platform/tenant-admin/
COPY packages/domains/procurement-center/package.json ./packages/domains/procurement-center/
COPY packages/domains/customer-center/package.json ./packages/domains/customer-center/
COPY packages/domains/material-center/package.json ./packages/domains/material-center/
COPY packages/domains/order-center/package.json ./packages/domains/order-center/
COPY tooling/db-migrate/package.json ./tooling/db-migrate/

RUN pnpm install --frozen-lockfile

# 3. 编译阶段 (Next.js Standalone 构建)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/control/node_modules ./apps/control/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 运行 Feature 同步、Prisma 客户端生成与独立打包
RUN pnpm sync:features && \
    pnpm --filter @base/db-control generate && \
    pnpm --filter @base/db-tenant generate && \
    pnpm --filter control build

# 4. 生产运行阶段 (Next.js 官方标准 Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# 拷贝 Next.js 官方 standalone 输出产物
COPY --from=builder /app/apps/control/public ./apps/control/public
COPY --from=builder /app/apps/control/.next/standalone ./
COPY --from=builder /app/apps/control/.next/static ./apps/control/.next/static

# 拷贝用于 Day 0 ensure 的迁移组件
COPY --from=builder /app/tooling/db-migrate ./tooling/db-migrate
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./

EXPOSE 3001

# 启动命令：自动执行 Day 0 平台基线与超管自愈，随后启动 Next.js 生产 standalone 服务
CMD ["sh", "-c", "pnpm db:platform:ensure && exec node apps/control/server.js"]
