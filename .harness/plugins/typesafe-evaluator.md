# TypeSafe 结构化判断器插件规范 (TypeSafe Evaluator Plugin)

> **定位**：Harness 可选扩展插件 (Optional Plugin)  
> **核心原则**：**Enhancement ≠ Dependency**（增强而非依赖，零侵入，零阻断）

---

## 一、 插件定位与分工

本插件基于 TypeSafe 判别模型（`typesafe_evaluate`），为 Coding Agent 提供闪电级结构化判断能力：

```text
主模型 (Thinking & Execution)         TypeSafe 判别器 (Optional Decision Plugin)
• 深度业务推理、长链路分析           • 不写代码，不做发散生成
• 架构方案制定与代码编写             • 仅负责轻量级结构化判定 (0~1 概率、YES/NO 单题、Choice)
• 负责真正执行与终审决策             • 仅作为决策辅助信号，几百毫秒极速返回
```

---

## 二、 启用检测与平滑降级 (Fallback)

1. **环境探测**：
   - 检查当前环境是否提供 `typesafe_evaluate` 工具（会话中执行 `/typesafe enable` 或环境变量配置了 `PI_TYPESAFE_ENABLED=1`）；
2. **条件路由**：
   - **能力存在**：路由并激活本插件，智能体在特定判断场景中主动调用；
   - **能力缺失**：直接不路由，自动保持原生主模型推演工作流，严禁报错、中断或强制要求安装。

---

## 三、 推荐应用场景

当判断可简化为 **YES/NO、单选（A/B/C）、0~1 概率打分或排序** 时，优先调用 TypeSafe：

| 场景 | 典型提问 | 作用与收益 |
| :--- | :--- | :--- |
| **Context / File Filtering** | 粗排搜索出的候选文件中，哪些与当前任务直接相关？ | 为候选文件打分，快速过滤噪音，防止上下文污染 |
| **Skill / Subagent Routing** | 当前任务最适合调用哪个 Skill 或派发给哪个角色？ | 辅助分类推荐，由主协调器最终定夺调度 |
| **Subagent Result Verification** | 验收项 1 是否实现？验收项 2 是否实现？ | 将复杂验收标准拆为独立 YES/NO 单题，快速核验交付物 |
| **Risk Gate (风险门禁)** | 该命令或操作是否具有破坏性或数据清空风险？ | 作为前置风险辅助预警信号（Additional Risk Signal） |
| **Patch / Diff Verification** | 该改动是否涉及跨切片越界、Schema 变更或鉴权修改？ | 辅助审查代码差异，决定是否触发额外专项复核 |

---

## 四、 提问规范与安全铁律

1. **One evaluation = one clear judgment**：
   - 每个问题必须独立、聚焦，避免混杂因果推导的大段问卷；
   - 指向 `state` 中的具体字段时，必须使用反引号标注（如 `` `files.f0` ``）；
   - 单选（Choice）问题必须包含保底项（如 `none` 或 `other`），杜绝强行错选。
2. **高危操作防线铁律**：
   - **判断器绝不能当做“免死金牌”**；
   - 涉及破坏性操作（如删库、破坏性迁移、批量删除、强推历史等），无论 TypeSafe 给出多高置信度，**一律强制触发人类确认 (`ask_user_question` / ConfirmDialog)**，严禁仅凭判断器自动放行。

---

## 五、 标准请求参数模板 (Canonical Payload Examples)

由于系统注入的工具描述未展开 `questions` 的深层 Schema，**调用时必须严格对齐以下字段命名，严禁凭主观臆测字段名**：

```json
{
  "state": {
    "target_feature": "workbench",
    "changed_files": ["apps/tenant/src/app/(dashboard)/workbench/page.tsx"],
    "action_type": "read"
  },
  "questions": {
    "q_is_safe": {
      "type": "noul",
      "instructions": "判断当前改动是否属于只读操作且无破坏性风险",
      "criteria": {
        "true": "是只读操作，无数据清空风险",
        "false": "涉及写入或破坏性变更"
      }
    },
    "q_category": {
      "type": "choice",
      "instructions": "对本次改动的模块类型进行分类",
      "criteria": {
        "ui_view": "属于 UI 视图装配或前端展示组件",
        "database_migration": "属于底层数据库 Schema 或数据迁移",
        "other": "属于其他基础设施或构建脚本"
      }
    },
    "q_quality_score": {
      "type": "score",
      "instructions": "针对代码实现的规范程度进行多维度打分",
      "criteria": [
        "符合垂直切片单向依赖与分层架构",
        "强类型无 any 降解且无魔法字符串"
      ]
    }
  }
}
```

### 关键字段名速查表（防错指南）

| 模式 | `type` 字段值 | `instructions` | `criteria` 字段格式与类型 |
| :--- | :--- | :--- | :--- |
| **布尔判别** | `"noul"` (全小写) | `string`（问题说明） | **必须是对象**：`{ "true": "...", "false": "..." }` |
| **单选分类** | `"choice"` (全小写) | `string`（问题说明） | **必须是键值对**：`{ "opt_a": "描述", "opt_b": "描述" }` |
| **维度打分** | `"score"` (全小写) | `string`（问题说明） | **必须是字符串数组**：`["维度1", "维度2"]` |

