#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}>>> 门禁验证自检${NC}"

# 1. 元数据校验
if [ ! -f "${WORKSPACE_ROOT}/feature_list.json" ]; then
  echo -e "• 元数据  : ${RED}缺少 feature_list.json${NC}"
  exit 1
fi
node -e "JSON.parse(require('fs').readFileSync('${WORKSPACE_ROOT}/feature_list.json'))" 2>/dev/null || {
  echo -e "• 元数据  : ${RED}feature_list.json 非法${NC}"
  exit 1
}
echo -e "• 元数据  : ${GREEN}Harness 账本合法${NC}"

# 2. 检查激活特性沙盒与修改边界
MEMBER_FILE="${WORKSPACE_ROOT}/member.local.md"
if [ -f "${MEMBER_FILE}" ]; then
  ACTIVE_FEAT=$(grep 'active_feature_id:' "${MEMBER_FILE}" | head -n 1 | awk -F '"' '{print $2}')
  if [ -n "$ACTIVE_FEAT" ] && [ -d "${WORKSPACE_ROOT}/.harness/features/${ACTIVE_FEAT}" ]; then
    echo -e "• 特性沙盒: ${GREEN}${ACTIVE_FEAT} 就绪${NC}"
  else
    echo -e "• 特性沙盒: ${YELLOW}${ACTIVE_FEAT:-none}${NC}"
  fi
fi
node "${WORKSPACE_ROOT}/scripts/check-boundary.mjs"

# 3. 架构红线与安全策略扫描
node "${WORKSPACE_ROOT}/scripts/check-redlines.mjs"

# 4. 构建/类型检查 (若项目已安装)
if [ -f "${WORKSPACE_ROOT}/package.json" ] && [ -d "${WORKSPACE_ROOT}/node_modules" ]; then
  if grep -q "\"check\"" "${WORKSPACE_ROOT}/package.json"; then
    pnpm --silent check
    echo -e "• 类型扫描: ${GREEN}通过${NC}"
  fi
else
  echo -e "• 代码检查: ${YELLOW}跳过 (尚未初始化 node_modules)${NC}"
fi

echo -e "${GREEN}✔ 门禁验证通过${NC}"
