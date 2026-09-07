# 特性背景：Harness 协作工程基础设施 (foundation-harness)

## 一、 需求目标

为辰润 ERP 项目建立“人类 + 多智能体”安全协同底座，消除记忆漂移、越权修改与带病交付。

## 二、 交付规格

1. 根目录最高宪法 (`AGENTS.md`, `CLAUDE.md`)，采用中文阐明五大红线与协同闭环。
2. 基础环境自检与极简门禁脚本 (`init.sh`, `scripts/verify.sh`, `scripts/status.sh`)。
3. 全局特性状态总账 `feature_list.json` 与会话锚点模板 `member.local.example.md`。
4. `.harness/` 标准基础设施（包含 `docs/`, `features/`, `memory/`, `protocols/` 等）。
