# 特性进展追踪 — feat-customer-center-official-crud-refactor

> **范式状态：已固化**  
> SOP：`references/9-crud-resource-paradigm.md`  
> 交接：同目录 `handoff.md`

## 本会话交付

- [x] 标杆：nuqs/list params、DataTable chrome、FormModal、createResourceActions/Page
- [x] `@base/biz-shared` 资源管道（不单开 `@base/crud`）
- [x] Skill：`SKILL.md` 地图化 + references 纠偏 + `9-crud-resource-paradigm.md`
- [x] 历史包袱：删除冗余壳；`@deprecated` 登记 DEBT-014/015
- [x] 用户审阅通过 → **本会话提交**

## 验证

- ui check/test · biz-shared check/test · customer-center 44/44 · tenant check 通过

## 新会话

按 handoff 迁移其他模块；禁止回退过时 API。
