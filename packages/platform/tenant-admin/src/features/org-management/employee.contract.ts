import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/** 员工列表 URL 搜索契约 (SSoT) */
export const employeeSearchParams = defineListSearchParams({
  departmentId: "",
  includeChildren: "true",
  positionId: "",
  role: "",
  status: "",
});

export type EmployeeSearchParams = ReturnType<typeof employeeSearchParams.parse>;

/** 员工专用业务动作标识 */
export const EmployeeAction = {
  TRANSFER_DEPT: "transferDept",
  TRANSFER_POSITION: "transferPosition",
  TRANSFER_ROLES: "transferRoles",
  TOGGLE_STATUS: "toggleStatus",
} as const;

export type EmployeeAction = (typeof EmployeeAction)[keyof typeof EmployeeAction];

/** 员工实体与资源标识 (SSoT) */
export const EmployeeSubject = "Employee";
export type EmployeeSubject = typeof EmployeeSubject;
export const EmployeeResource = "organization.employee";
export type EmployeeResource = typeof EmployeeResource;

/** 员工受控字段字典 */
export const EmployeeField = {
  NAME: "name",
  NAME_SNAPSHOT: "nameSnapshot",
  EMAIL: "email",
  EMAIL_SNAPSHOT: "emailSnapshot",
  EMPLOYEE_NO: "employeeNo",
  DEPARTMENT_ID: "departmentId",
  POSITION_ID: "positionId",
  STATUS: "status",
} as const;

export type EmployeeField = (typeof EmployeeField)[keyof typeof EmployeeField];

/** 员工受控字段元数据定义 */
export const employeeConfigurableFields = [
  {
    field: EmployeeField.NAME,
    label: "员工姓名",
    isSensitive: false,
  },
  {
    field: EmployeeField.EMAIL,
    label: "电子邮箱",
    isSensitive: true,
  },
  { field: EmployeeField.EMPLOYEE_NO, label: "员工工号", isSensitive: false },
  {
    field: EmployeeField.DEPARTMENT_ID,
    label: "归属部门",
    isSensitive: false,
  },
  { field: EmployeeField.POSITION_ID, label: "担任岗位", isSensitive: false },
  { field: EmployeeField.STATUS, label: "在职状态", isSensitive: false },
] as const;

/**
 * 员工管理页面纯数据权限契约 (SSoT)
 */
export const employeePageContract: FeaturePagePermissionDescriptor = {
  resource: EmployeeResource,
  subject: EmployeeSubject,
  label: "员工管理",
  path: "/organization/employees",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建" },
    {
      action: StandardAction.UPDATE,
      label: "调岗/调部门",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "停用/离职" },
    { action: EmployeeAction.TRANSFER_DEPT, label: "调动部门" },
    { action: EmployeeAction.TRANSFER_POSITION, label: "调整岗位" },
    { action: EmployeeAction.TRANSFER_ROLES, label: "分配角色" },
    { action: EmployeeAction.TOGGLE_STATUS, label: "启停状态" },
  ],
  configurableFields: employeeConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
