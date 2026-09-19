/**
 * ERP 标准业务实体的平台级通用操作动作枚举 (Standard Actions)
 *
 * 规范：禁止各业务模块在常规 CRUD 与工作台操作上随意手写魔术字符串。
 * 平台通用列表工作台组件 (<BusinessTableWorkspace />) 将基于此枚举进行默认的按钮权限自动拦截与状态联动。
 */
export const StandardAction = {
 // --- 列表全局级操作 ---
 /** 查看/查询列表与实体数据 */
 READ: "read",
 /** 新增单据/创建实体 (对应列表页顶部 "+ 新增" 主按钮) */
 CREATE: "create",
 /** 导出数据 (对应工具栏 "导出当前视图/导出") */
 EXPORT: "export",
 /** 导入数据 (对应工具栏 "导入") */
 IMPORT: "import",
 /** 打印单据/列表 (对应工具栏 "打印列表") */
 PRINT: "print",
 /** 批量删除/批量操作 */
 BATCH_DELETE: "batch_delete",

 // --- 单据行级与状态操作 ---
 /** 查看详情 (对应表格行操作 "查看详情") */
 DETAIL: "detail",
 /** 编辑/修改单据 (对应表格行操作 "编辑/修改") */
 UPDATE: "update",
 /** 删除单据 (对应表格行操作 "删除") */
 DELETE: "delete",
 /** 启停状态/启用停用生命周期切换 (对应表格行操作 "停用/启用") */
 TOGGLE_STATUS: "toggle_status",
} as const;

export type StandardAction =
 (typeof StandardAction)[keyof typeof StandardAction];
