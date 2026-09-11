"use client";

import React, { cloneElement, isValidElement, useContext } from "react";
import { FieldPolicy, type FieldAccessMode } from "@chenrun/shared";
import { useOptionalAbility } from "@chenrun/authorization";
import { Field, FieldLabel } from "../../shadcn/field";
import { Badge } from "../../shadcn/badge";
import { DataTableContext } from "../data-table/DataTableContext";

export type { FieldAccessMode } from "@chenrun/shared";

export interface AbilityLike {
  can(action: string, subject: string, field?: string): boolean;
}

export interface AuthFieldProps {
  /** CASL Ability；未传则读 AbilityProvider（官方范式） */
  readonly ability?: AbilityLike | null;
  /** 实体名称；未传则从 DataTableContext 继承 subject */
  readonly subject?: string;
  /** 字段名 (如 'costPrice', 'supplierName') */
  readonly field: string;
  /** 校验写入能力的动作，默认为 "update"，新增表单可指定为 "create" */
  readonly action?: string;
  /** 手动指定的模式覆盖 (优先级高于自动推导) */
  readonly mode?: FieldAccessMode;
  /** 表单控件子元素 (如 <Input />, <Select />) */
  readonly children: React.ReactElement<{
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
  }>;
  /** 字段中文显示名称/标题 */
  readonly label?: string;
  /** 隐藏或无权访问时的占位渲染内容 (默认不渲染) */
  readonly fallback?: React.ReactNode;
  readonly className?: string;
}

/**
 * 推导字段访问三态 (HIDDEN, READONLY, EDITABLE)
 * - 不能 read -> HIDDEN
 * - 能 read 但不能 write -> READONLY
 * - 能 read 且能 write -> EDITABLE
 */
export function deriveFieldMode(
  ability: AbilityLike | null | undefined,
  subject: string,
  field: string,
  action: string = "update",
  overrideMode?: FieldAccessMode,
): FieldAccessMode {
  if (overrideMode) {
    return overrideMode;
  }
  if (!ability) {
    return FieldPolicy.HIDDEN;
  }

  const readable = ability.can("read", subject, field);
  const writable = ability.can(action, subject, field);

  if (!readable) {
    return FieldPolicy.HIDDEN;
  }
  if (!writable) {
    return FieldPolicy.READONLY;
  }
  return FieldPolicy.EDITABLE;
}

/**
 * 字段权限积木：CASL 三态 × shadcn Field 官方组合。
 * 外壳完全来自 Field/FieldLabel/Badge；权限判定走 AbilityProvider。
 */
export function AuthField({
  ability: explicitAbility,
  subject: explicitSubject,
  field,
  action = "update",
  mode,
  children,
  label,
  fallback = null,
  className,
}: AuthFieldProps) {
  const tableContext = useContext(DataTableContext);
  const caslAbility = useOptionalAbility();

  const ability =
    explicitAbility !== undefined ? explicitAbility : caslAbility;
  const subject = explicitSubject || tableContext?.subject || "";

  const resolvedMode = deriveFieldMode(ability, subject, field, action, mode);

  if (resolvedMode === FieldPolicy.HIDDEN) {
    return fallback ? <>{fallback}</> : null;
  }

  const isReadOnly = resolvedMode === FieldPolicy.READONLY;

  let childElement: React.ReactNode = children;
  if (isValidElement(children)) {
    childElement = cloneElement(children, {
      disabled: isReadOnly || children.props.disabled,
      readOnly: isReadOnly || children.props.readOnly,
    });
  }

  return (
    <Field
      data-disabled={isReadOnly || undefined}
      data-slot="auth-field"
      className={className}
    >
      {label ? (
        <FieldLabel>
          <span>{label}</span>
          {isReadOnly ? (
            <Badge variant="secondary" size="sm">
              只读
            </Badge>
          ) : null}
        </FieldLabel>
      ) : null}
      {childElement}
    </Field>
  );
}

export { AuthField as AuthorizedField };
