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
echo -e "${BLUE}[1/3] 治理底座:${NC}"
node .harness/lifecycle/bootstrap.mjs

# 2. 检查开发环境 (Node / pnpm / Git / Hooks)
echo -e "${BLUE}[2/3] 开发环境:${NC}"
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
echo -e "${BLUE}[3/4] 环境变量检查:${NC}"
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

# 4. 会话状态与沙盒检测
echo -e "${BLUE}[4/4] 会话上下文:${NC}"
node .harness/lifecycle/session-start.mjs

echo -e "${GREEN}✔ 全部自检通过，环境就绪${NC}"
