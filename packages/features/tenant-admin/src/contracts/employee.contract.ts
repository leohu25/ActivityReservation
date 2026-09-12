import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 员工实体与资源标识 (SSoT) */
export const EmployeeSubject = "Employee";
export const EmployeeResource = "organization.employee";

/** 员工受控字段字典 */
export const EmployeeField = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  EMPLOYEE_NO: "employeeNo",
  DEPARTMENT_IDS: "departmentIds",
  POSITION_IDS: "positionIds",
  STATUS: "status",
} as const;

export type EmployeeField = (typeof EmployeeField)[keyof typeof EmployeeField];

/** 员工受控字段元数据定义 */
export const employeeConfigurableFields = [
  { field: EmployeeField.NAME, label: "员工姓名", isSensitive: false },
  { field: EmployeeField.EMAIL, label: "电子邮箱", isSensitive: false },
  { field: EmployeeField.PHONE, label: "联系电话 (敏感)", isSensitive: true },
  { field: EmployeeField.EMPLOYEE_NO, label: "员工工号", isSensitive: false },
  {
    field: EmployeeField.DEPARTMENT_IDS,
    label: "归属部门",
    isSensitive: false,
  },
  { field: EmployeeField.POSITION_IDS, label: "担任岗位", isSensitive: false },
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
  ],
  configurableFields: employeeConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
