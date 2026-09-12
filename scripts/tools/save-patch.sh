#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd) )"
PATCH_DIR="${WORKSPACE_ROOT}/.harness/patches"
TECH_DEBT_FILE="${WORKSPACE_ROOT}/.harness/memory/technical-debt.md"

if [ $# -lt 1 ]; then
  echo "用法: ./scripts/tools/save-patch.sh \"补丁描述说明\" [可选文件路径...]"
  echo "示例: ./scripts/tools/save-patch.sh \"修复采购计算溢出\" packages/features/procurement-center/src/calc.ts"
  exit 1
fi

DESCRIPTION="$1"
shift || true
SPECIFIC_FILES=("$@")

mkdir -p "${PATCH_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SLUG=$(echo "${DESCRIPTION}" | tr ' ' '_' | tr -cd '[:alnum:]_-' | cut -c 1-30)
if [ -z "${SLUG}" ]; then
  SLUG="spillover"
fi

PATCH_FILENAME="${TIMESTAMP}_${SLUG}.patch"
PATCH_PATH="${PATCH_DIR}/${PATCH_FILENAME}"

if [ ${#SPECIFIC_FILES[@]} -eq 0 ]; then
  # 提取当前工作区未暂存与已暂存的全部 diff
  git diff HEAD >"${PATCH_PATH}" || true
  if [ ! -s "${PATCH_PATH}" ]; then
    git diff >"${PATCH_PATH}" || true
  fi
else
  git diff HEAD -- "${SPECIFIC_FILES[@]}" >"${PATCH_PATH}" || true
  if [ ! -s "${PATCH_PATH}" ]; then
    git diff -- "${SPECIFIC_FILES[@]}" >"${PATCH_PATH}" || true
  fi
fi

if [ ! -s "${PATCH_PATH}" ]; then
  rm -f "${PATCH_PATH}"
  echo "✗ 没有检测到可归档的代码变动 (diff 为空)。"
  exit 1
fi

echo "✔ 成功提取代码变动并保存补丁: .harness/patches/${PATCH_FILENAME}"

# 自动登记到 .harness/memory/technical-debt.md
if [ -f "${TECH_DEBT_FILE}" ]; then
  echo "" >>"${TECH_DEBT_FILE}"
  echo "### 待合入补丁: ${DESCRIPTION} (${TIMESTAMP})" >>"${TECH_DEBT_FILE}"
  echo "- **补丁归档**: \`.harness/patches/${PATCH_FILENAME}\`" >>"${TECH_DEBT_FILE}"
  echo "- **产生时间**: $(date +'%Y-%m-%d %H:%M:%S')" >>"${TECH_DEBT_FILE}"
  echo "- **状态**: PENDING_MERGE" >>"${TECH_DEBT_FILE}"
  echo "✔ 已自动登记至 .harness/memory/technical-debt.md"
fi

echo ""
echo "💡 提示: 若需将该变动从当前工作区恢复/清理，可按需执行:"
if [ ${#SPECIFIC_FILES[@]} -gt 0 ]; then
  echo "   git checkout -- ${SPECIFIC_FILES[*]}"
else
  echo "   git restore .  (或保留并另建分支 git checkout -b feat/spillover)"
fi
