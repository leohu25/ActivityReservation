#!/usr/bin/env bash
set -e
set -uo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${WORKSPACE_ROOT}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}>>> 全栈 Harness 启动自检 (Environment Check & Test)${NC}"

# 1. 检查根目录治理底座
echo -e "${BLUE}[1/6] 治理底座:${NC}"
node .harness/lifecycle/bootstrap.mjs

# 2. 检查开发环境 (Node / pnpm / Git / Hooks)
echo -e "${BLUE}[2/6] 开发环境:${NC}"
REQ_NODE=22
NODE_VER=$(node -v 2>/dev/null || echo "none")
if [ "$NODE_VER" = "none" ]; then
  echo -e "  ${RED}✗ Node.js 未安装 (需 >= v${REQ_NODE})${NC}"
  exit 1
fi
echo -e "  • Node.js : ${GREEN}${NODE_VER}${NC}"

PNPM_VER=$(pnpm -v 2>/dev/null || echo "none")
if [ "$PNPM_VER" = "none" ]; then
  echo -e "  ${RED}✗ pnpm 未安装${NC}"
  exit 1
fi
echo -e "  • pnpm    : ${GREEN}v${PNPM_VER}${NC}"

# 配置 Git pre-commit 物理门禁
if [ -d "${WORKSPACE_ROOT}/.git" ]; then
  HOOK_DIR="${WORKSPACE_ROOT}/.git/hooks"
  mkdir -p "${HOOK_DIR}"
  cat <<'EOF' >"${HOOK_DIR}/pre-commit"
#!/usr/bin/env bash
./scripts/verify.sh
EOF
  chmod +x "${HOOK_DIR}/pre-commit"
  echo -e "  • Git     : ${GREEN}就绪 (已装载 pre-commit 物理门禁)${NC}"
else
  echo -e "  • Git     : ${GREEN}就绪 (clean restartable)${NC}"
fi

# 3. 环境变量引导检查
echo -e "${BLUE}[3/6] 环境变量检查:${NC}"
if [ ! -f "${WORKSPACE_ROOT}/apps/tenant/.env.local" ]; then
  echo -e "  • apps/tenant/.env.local : ${RED}未配置${NC} (可通过 cp apps/tenant/.env.example apps/tenant/.env.local 初始化)"
else
  echo -e "  • apps/tenant/.env.local : ${GREEN}已就绪${NC}"
fi

if [ ! -f "${WORKSPACE_ROOT}/apps/control/.env.local" ]; then
  echo -e "  • apps/control/.env.local: ${RED}未配置${NC} (可通过 cp apps/control/.env.example apps/control/.env.local 初始化)"
else
  echo -e "  • apps/control/.env.local: ${GREEN}已就绪${NC}"
fi

# 4. 离线类型与客户端生成（自愈确保干净克隆后开箱即用）
echo -e "${BLUE}[4/6] Prisma 客户端自愈生成 (Turborepo Pipeline):${NC}"
pnpm turbo run generate --output-logs=errors-only >/dev/null 2>&1 || pnpm turbo run generate
echo -e "  • Prisma Client: ${GREEN}已就绪 (db-control & db-tenant)${NC}"

# 5. Control DB Day 0 自愈初始化（开发与生产使用相同运行时机制）
if [ -f "${WORKSPACE_ROOT}/apps/control/.env.local" ]; then
  echo -e "${BLUE}[5/6] Control DB 基线检查:${NC}"
  pnpm db:platform:ensure
else
  echo -e "${BLUE}[5/6] Control DB 基线检查:${NC}"
  echo -e "  • 跳过：apps/control/.env.local 未配置"
fi

# 6. 会话状态与沙盒检测
echo -e "${BLUE}[6/6] 会话上下文:${NC}"
node .harness/lifecycle/session-start.mjs

echo -e "${GREEN}✔ 全部自检通过，环境就绪${NC}"
