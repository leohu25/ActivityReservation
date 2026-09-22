"use client";

import { useMemo, useState, useEffect } from "react";
import {
  FormModal,
  type FormFieldSchema,
  Checkbox,
  toast,
} from "@base/ui";
import {
  directCreateEmployeeAction,
  updateEmployeeAction,
} from "../actions";
import { getUploadPresignedUrlAction } from "../../../attachment/actions";
import {
  directCreateEmployeeSchema,
  updateEmployeeSchema,
  type DirectCreateEmployeeSchema,
  type UpdateEmployeeSchema,
} from "../schema";
import { EmployeeSubject } from "../contract";
import type { EmployeeItem } from "../types";
import type { PositionItem } from "../../position/types";

export interface EmployeeFormModalProps {
  readonly open: boolean;
  readonly mode: "create" | "edit" | "view";
  readonly record?: EmployeeItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly flatDepts: readonly { id: string; name: string; depth: number }[];
  readonly positions: readonly PositionItem[];
  readonly availableRoles: readonly { role: string; name: string }[];
  readonly defaultDeptId?: string | null;
  readonly inline?: boolean;
}

/**
 * 员工档案三态表单弹窗 (标准 FormModal 驱动)
 * 支持 create (直接录入建号) / edit (修改档案/调岗/调部门/调角色) / view (查看档案)
 */
export function EmployeeFormModal({
  open,
  mode,
  record,
  onClose,
  onSuccess,
  flatDepts,
  positions,
  availableRoles,
  defaultDeptId,
  inline,
}: EmployeeFormModalProps) {
  const isCreate = mode === "create";
  const isView = mode === "view";

  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    return record?.roles ? [...record.roles] : ["member"];
  });

  useEffect(() => {
    if (record?.roles) {
      setSelectedRoles([...record.roles]);
    } else {
      setSelectedRoles(["member"]);
    }
  }, [record]);

  const initialValues = useMemo(() => {
    if (isCreate) {
      return {
        name: "",
        loginAccount: "",
        employeeNo: "",
        phone: "",
        email: "",
        departmentId: defaultDeptId ?? "",
        positionId: "",
        managerEmployeeId: null,
        jobTitle: "",
        avatarUrl: "",
        initialRoleCodes: ["member"],
        password: "Admin123456!",
      };
    }
    return {
      name: record?.name ?? "",
      loginAccount: record?.loginAccount ?? "",
      employeeNo: record?.employeeNo ?? "",
      phone: record?.phone ?? "",
      email: record?.email ?? "",
      departmentId: record?.departmentId ?? "",
      positionId: record?.positionId ?? "",
      jobTitle: record?.jobTitle ?? "",
      avatarUrl: record?.avatarUrl ?? "",
      roles: record?.roles ? [...record.roles] : [],
    };
  }, [isCreate, record, defaultDeptId]);

  const fields: FormFieldSchema[] = useMemo(() => {
    const list: FormFieldSchema[] = [
      {
        name: "name",
        label: "员工姓名",
        type: "text",
        required: true,
        disabled: isView,
        placeholder: "例如: 王小明",
      },
      {
        name: "loginAccount",
        label: "登录账号",
        type: "text",
        required: true,
        disabled: isView,
        placeholder: "例如: E0001 / zhangsan / 手机号",
        hint: isCreate
          ? "企业内唯一登录名。留空时可按工号或手机号填写；与工号、邮箱相互独立"
          : "登录账号为企业内唯一凭证，修改后请告知员工使用新账号登录",
      },
      {
        name: "employeeNo",
        label: "员工工号",
        type: "text",
        disabled: isView,
        placeholder: "例如: CR-0089",
        hint: "人事档案字段，不直接作为登录标识",
      },
      {
        name: "phone",
        label: "手机号",
        type: "text",
        disabled: isView,
        placeholder: "例如: 13800001111",
      },
      {
        name: "email",
        label: "电子邮箱",
        type: "text",
        required: false,
        disabled: isView,
        placeholder: "可选，仅作工作联系方式",
        hint: "不参与登录；无邮箱可留空",
      },
      {
        name: "jobTitle",
        label: "职务职称",
        type: "text",
        disabled: isView,
        placeholder: "例如: 高级开发工程师",
      },
      {
        name: "departmentId",
        label: "归属部门",
        type: "combobox",
        required: true,
        disabled: isView,
        placeholder: "选择归属部门...",
        searchPlaceholder: "输入部门名称过滤...",
        clearable: false,
        options: flatDepts.map((d) => ({
          value: d.id,
          label: `${"　".repeat(d.depth)}${d.name}`,
        })),
      },
      {
        name: "positionId",
        label: "担任岗位",
        type: "combobox",
        disabled: isView,
        placeholder: "选择担任岗位...",
        searchPlaceholder: "输入岗位名称或编码过滤...",
        clearable: true,
        options: positions.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.code})`,
        })),
      },
      {
        name: "avatarUrl",
        label: "员工证件头像",
        type: "image",
        module: "employee",
        disabled: isView,
        onUploadAction: getUploadPresignedUrlAction,
        span: 2,
      },
    ];

    if (isCreate) {
      list.push({
        name: "password",
        label: "初始登录密码 (选填，留空默认 Admin123456!)",
        type: "text",
        placeholder: "Admin123456!",
        span: 2,
      });
    }

    return list;
  }, [isCreate, isView, flatDepts, positions]);

  const toggleRole = (roleCode: string) => {
    if (isView) return;
    setSelectedRoles((prev) => {
      const exists = prev.includes(roleCode);
      if (exists) {
        if (prev.length <= 1) {
          toast.error("员工至少需保留一个系统角色");
          return prev;
        }
        return prev.filter((r) => r !== roleCode);
      }
      return [...prev, roleCode];
    });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isView) {
      onClose();
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("请至少勾选一个系统业务角色");
      throw new Error("请至少勾选一个系统业务角色");
    }

    if (isCreate) {
      const payload: DirectCreateEmployeeSchema = {
        name: String(values.name ?? "").trim(),
        loginAccount: String(values.loginAccount ?? "").trim(),
        employeeNo: String(values.employeeNo ?? "").trim(),
        phone: String(values.phone ?? "").trim(),
        email: String(values.email ?? "").trim(),
        departmentId: String(values.departmentId ?? ""),
        positionId: values.positionId ? String(values.positionId) : null,
        managerEmployeeId: null,
        jobTitle: String(values.jobTitle ?? "").trim(),
        avatarUrl: values.avatarUrl ? String(values.avatarUrl).trim() : null,
        initialRoleCodes: selectedRoles,
        password:
          String(values.password ?? "").trim() || "Admin123456!",
      };

      const res = await directCreateEmployeeAction(payload);
      if (!res.success) {
        toast.error(res.error || "创建员工失败");
        throw new Error(res.error || "创建员工失败");
      }
      toast.success(`员工 [${res.data.name}] 已成功录入`);
    } else if (record) {
      const payload: UpdateEmployeeSchema = {
        name: String(values.name ?? "").trim(),
        loginAccount: String(values.loginAccount ?? "").trim(),
        employeeNo: String(values.employeeNo ?? "").trim(),
        phone: String(values.phone ?? "").trim(),
        email: String(values.email ?? "").trim(),
        departmentId: String(values.departmentId ?? ""),
        positionId: values.positionId ? String(values.positionId) : null,
        jobTitle: String(values.jobTitle ?? "").trim(),
        avatarUrl: values.avatarUrl ? String(values.avatarUrl).trim() : null,
        roles: selectedRoles,
      };

      const res = await updateEmployeeAction(record.id, payload);
      if (!res.success) {
        toast.error(res.error || "更新员工失败");
        throw new Error(res.error || "更新员工失败");
      }
      toast.success(`员工 [${record.name}] 档案已更新`);
    }

    onSuccess?.();
    onClose();
  };

  return (
    <FormModal<Record<string, unknown>>
      open={open}
      inline={inline}
      onClose={onClose}
      mode={mode}
      subject={EmployeeSubject}
      title={
        isCreate
          ? "新建员工档案 (免邮件建号)"
          : isView
            ? `员工详情: ${record?.name ?? ""}`
            : `编辑员工: ${record?.name ?? ""}`
      }
      description={
        isCreate
          ? "原子创建租户独立登录账号与在职员工档案。员工凭企业编码 + 登录账号 + 密码登录。"
          : isView
            ? "查看员工基础档案、归属部门、职务岗位与授权角色。"
            : "维护员工姓名、工号、职务、归属部门、岗位字典与业务角色。"
      }
      schema={isCreate ? directCreateEmployeeSchema : updateEmployeeSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isCreate ? "立即创建并入职" : isView ? "关闭" : "保存修改"}
      className="sm:max-w-3xl"
      onSubmit={handleSubmit}
      extraContent={
        <div className="space-y-2 mt-4 rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="text-xs font-semibold text-foreground">
            分配系统业务角色 <span className="text-destructive">*</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pt-1">
            {availableRoles.map((r) => {
              const checked = selectedRoles.includes(r.role);
              const inputId = `form-role-${r.role}`;
              return (
                <label
                  key={r.role}
                  htmlFor={inputId}
                  className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none rounded-md border border-border/60 p-2 hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    disabled={isView}
                    onCheckedChange={() => toggleRole(r.role)}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate">
                      {r.role}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
