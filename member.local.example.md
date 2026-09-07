# 会话与特性激活配置 (member.local.md 示例)

> 使用说明：请复制此文件为根目录下的 `member.local.md`。  
> 注意：`member.local.md` 已被 `.gitignore` 保护，切勿将其提交至 Git。

```yaml
# 当前开发者或智能体标识
developer: "agent-assistant"

# 当前激活并认领的唯一特性 ID（必须对应 feature_list.json 中的特性 id）
active_feature_id: "foundation-harness"

# 当前任务角色 (coordinator | researcher | implementer | reviewer)
role_focus: "coordinator"

# 会话启动时间
started_at: "2025-05-18T10:00:00Z"
```
