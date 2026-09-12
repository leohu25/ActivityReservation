#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd) )"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}>>> 工作区协同状态${NC}"

# 1. 检查当前激活特性 (三级自适应解析)
FEAT_INFO=$(node "${WORKSPACE_ROOT}/.harness/lifecycle/resolve-feature.mjs" --source 2>/dev/null || echo "none|global")
ACTIVE_FEAT=$(echo "${FEAT_INFO}" | cut -d'|' -f1)
FEAT_SOURCE=$(echo "${FEAT_INFO}" | cut -d'|' -f2)

if [ "${ACTIVE_FEAT}" != "none" ] && [ -n "${ACTIVE_FEAT}" ]; then
  echo -e "• 协同上下文: 激活特性: ${GREEN}${ACTIVE_FEAT}${NC} (来源: ${FEAT_SOURCE})"
else
  echo -e "• 协同上下文: ${YELLOW}全局基线模式 (未锁定特性)${NC}"
fi

# 2. 检查 Git 仓库状态
if [ -d "${WORKSPACE_ROOT}/.git" ]; then
  cd "${WORKSPACE_ROOT}"
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
  if [ -z "${CURRENT_BRANCH}" ]; then
    CURRENT_BRANCH="main"
  fi
  CURRENT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "init")
  echo -e "• Git 状态  : 分支 ${GREEN}${CURRENT_BRANCH}${NC} (${CURRENT_HASH})"

  REPO_CHANGES=$(git status --short)
  if [ -z "${REPO_CHANGES}" ]; then
    echo -e "• 工作区    : ${GREEN}干净 (无未提交更改)${NC}"
  else
    COUNT=$(echo "${REPO_CHANGES}" | wc -l | tr -d ' ')
    echo -e "• 工作区    : ${YELLOW}存在 ${COUNT} 处未提交改动:${NC}"
    echo "${REPO_CHANGES}" | sed 's/^/    /'
  fi
fi
