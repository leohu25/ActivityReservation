# ==============================================================================
# 平台管控端 (Control Admin) 生产多阶段构建 Dockerfile
# 采用 Turborepo 官方推荐的 `turbo prune` 自动化依赖裁剪机制
# 无论新增/删除多少个 packages/* 或 domains/*，均由 Turborepo 自动解析依赖，彻底免维护
# Monorepo 根上下文构建: docker build -t base-control:latest -f apps/control/Dockerfile .
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
RUN turbo prune control --docker

# 3. 依赖安装阶段 (仅安装 control 及其依赖包的依赖，极致利用 Docker 构建缓存)
FROM base AS deps
WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml /app/out/pnpm-workspace.yaml ./
COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

# 4. 编译构建阶段 (Next.js Standalone 构建)
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/control/node_modules ./apps/control/node_modules
COPY --from=pruner /app/out/full/ ./
# 补充平台迁移引擎生成脚本与目录
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 利用 Turborepo 原生拓扑流水线执行构建 (自动触发 codegen -> generate -> build)
RUN pnpm exec turbo run build --filter=control

# 5. 生产运行阶段 (Next.js 官方标准 Runner)
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

# 启动命令：启动 Next.js 生产 standalone 服务（由 instrumentation.ts 自动执行平台总控库自愈与超管初始化）
CMD ["node", "apps/control/server.js"]
