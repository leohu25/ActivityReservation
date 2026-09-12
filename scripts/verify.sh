#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 静默执行：成功只打一行标签；失败才展开完整日志
# 成功时若日志含自动扩围等关键事件，则透出该行
run_quiet() {
  local label="$1"
  shift
  local log
  log="$(mktemp)"
  if "$@" >"$log" 2>&1; then
    if grep -q "Auto-Recorded" "$log"; then
      grep "Auto-Recorded" "$log" | sed 's/^/  /'
    fi
    echo -e "• ${label}: ${GREEN}通过${NC}"
    rm -f "$log"
    return 0
  fi
  echo -e "• ${label}: ${RED}失败${NC}"
  cat "$log"
  rm -f "$log"
  return 1
}

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
echo -e "• 元数据  : ${GREEN}合法${NC}"

# 2. 特性沙盒与边界
FEAT_INFO=$(node "${WORKSPACE_ROOT}/.harness/lifecycle/resolve-feature.mjs" --source 2>/dev/null || echo "none|global")
ACTIVE_FEAT=$(echo "${FEAT_INFO}" | cut -d'|' -f1)
FEAT_SOURCE=$(echo "${FEAT_INFO}" | cut -d'|' -f2)

if [ "${ACTIVE_FEAT}" != "none" ] && [ -n "${ACTIVE_FEAT}" ]; then
  echo -e "• 特性沙盒: ${GREEN}${ACTIVE_FEAT}${NC} (来源: ${FEAT_SOURCE})"
fi
run_quiet "沙盒边界" node "${WORKSPACE_ROOT}/scripts/check/check-boundary.mjs"

# 3. 架构红线
run_quiet "红线扫描" node "${WORKSPACE_ROOT}/scripts/check/check-redlines.mjs"

# 4. 业务实体基础审计与软删除规范
run_quiet "实体基线" node "${WORKSPACE_ROOT}/scripts/check-entity-baseline.mjs"

# 5. 业务垂直切片架构完整性
run_quiet "业务切片" node "${WORKSPACE_ROOT}/scripts/check/check-vertical-slices.mjs"

# 6. 门禁与红线自身单测
run_quiet "门禁单测" node --test "${WORKSPACE_ROOT}/scripts/check/check-redlines.test.mjs" "${WORKSPACE_ROOT}/scripts/check/check-vertical-slices.test.mjs" "${WORKSPACE_ROOT}/scripts/check-entity-baseline.test.mjs"

# 6. 类型检查
if [ -f "${WORKSPACE_ROOT}/package.json" ] && [ -d "${WORKSPACE_ROOT}/node_modules" ]; then
  if grep -q "\"check\"" "${WORKSPACE_ROOT}/package.json"; then
    run_quiet "类型扫描" pnpm --silent check
  fi
else
  echo -e "• 代码检查: ${YELLOW}跳过 (尚未初始化 node_modules)${NC}"
fi

echo -e "${GREEN}✔ 门禁验证通过${NC}"
