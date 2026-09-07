#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}>>> 工作区协同状态${NC}"

# 1. 检查 member.local.md
MEMBER_FILE="${WORKSPACE_ROOT}/member.local.md"
if [ -f "${MEMBER_FILE}" ]; then
  ACTIVE_FEAT=$(grep 'active_feature_id:' "${MEMBER_FILE}" | head -n 1 | awk -F '"' '{print $2}')
  ROLE_FOCUS=$(grep 'role_focus:' "${MEMBER_FILE}" | head -n 1 | awk -F '"' '{print $2}')
  echo -e "• 协同上下文: 激活特性: ${GREEN}${ACTIVE_FEAT:-none}${NC} | 角色焦点: ${GREEN}@${ROLE_FOCUS:-none}${NC}"
else
  echo -e "• 协同上下文: ${YELLOW}未设定 member.local.md (公共模式)${NC}"
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
