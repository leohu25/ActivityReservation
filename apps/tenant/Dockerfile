# ==============================================================================
# 租户业务端 (Tenant SaaS) 生产多阶段构建 Dockerfile
# 采用 Turborepo 官方推荐的 `turbo prune` 自动化依赖裁剪机制
# 无论新增/删除多少个 packages/* 或 domains/*，均由 Turborepo 自动解析依赖，彻底免维护
# Monorepo 根上下文构建: docker build -t base-tenant:latest -f apps/tenant/Dockerfile .
# ==============================================================================

# 1. 基础环境
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

# 2. 依赖解析阶段 (Turborepo 智能裁剪)
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2.4.4
COPY . .
RUN turbo prune tenant --docker

# 3. 依赖安装阶段 (仅安装 tenant 及其依赖包的依赖，极致利用 Docker 构建缓存)
FROM base AS deps
WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml /app/out/pnpm-workspace.yaml ./
COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

# 4. 编译构建阶段 (Next.js Standalone 构建)
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/tenant/node_modules ./apps/tenant/node_modules
COPY --from=pruner /app/out/full/ ./
# 补充其余工程上下文
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 利用 Turborepo 原生拓扑流水线执行构建 (自动触发 codegen -> generate -> build)
RUN pnpm exec turbo run build --filter=tenant

# 5. 生产运行阶段 (Next.js 官方标准 Runner)
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
