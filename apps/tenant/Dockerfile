# ==============================================================================
# 租户业务端 (Tenant SaaS) 生产多阶段构建 Dockerfile
# 基于 Next.js 官方推荐 standalone 模式与轻量生产运行镜像
# Monorepo 根上下文构建: docker build -t base-tenant:latest -f apps/tenant/Dockerfile .
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
COPY apps/tenant/package.json ./apps/tenant/
COPY packages/auth/package.json ./packages/auth/
COPY packages/authorization/package.json ./packages/authorization/
COPY packages/db-control/package.json ./packages/db-control/
COPY packages/db-tenant/package.json ./packages/db-tenant/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/features/control-admin/package.json ./packages/features/control-admin/
COPY packages/features/tenant-admin/package.json ./packages/features/tenant-admin/
COPY packages/features/procurement-center/package.json ./packages/features/procurement-center/
COPY packages/features/customer-center/package.json ./packages/features/customer-center/
COPY tooling/db-migrate/package.json ./tooling/db-migrate/

RUN pnpm install --frozen-lockfile

# 3. 编译阶段 (Next.js Standalone 构建)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/tenant/node_modules ./apps/tenant/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 运行 Feature 同步、Prisma 客户端生成与独立打包
RUN pnpm sync:features && \
    pnpm --filter @base/db-control generate && \
    pnpm --filter @base/db-tenant generate && \
    pnpm --filter tenant build

# 4. 生产运行阶段 (Next.js 官方标准 Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# 拷贝 Next.js 官方 standalone 输出产物与静态资源
COPY --from=builder /app/apps/tenant/public ./apps/tenant/public
COPY --from=builder /app/apps/tenant/.next/standalone ./
COPY --from=builder /app/apps/tenant/.next/static ./apps/tenant/.next/static

EXPOSE 3000

# 启动命令：直接启动 Next.js 生产 standalone 服务
CMD ["node", "apps/tenant/server.js"]
