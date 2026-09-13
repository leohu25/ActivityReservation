"use client";

import { type ReactNode, useContext } from "react";
import { useOptionalAbility } from "@base/authorization";
import { DataTableContext } from "../table/DataTableContext";

export interface AuthGuardProps {
  /** 实体名称，若未传则自动从 DataTableContext 继承 */
  subject?: string;
  /** 权限动作名称 (如 'create', 'export', 'delete') */
  action: string;
  /** 受控字段 (可选) */
  field?: string;
  /** 自定义 CASL Ability 实例，若未传则自动从 DataTableContext 继承 */
  ability?: {
    can(action: string, subject: string, field?: string): boolean;
  } | null;
  /** 无权限时的替代渲染内容，默认 null (直接隐藏) */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * 声明式权限门禁积木 (AuthGuard)
 * 依据当前 CASL Ability 自动判定是否渲染子元素。
 * 在 DataTable 内部使用时自动继承 ability 与 subject。
 */
export function AuthGuard({
  subject: explicitSubject,
  action,
  field,
  ability: explicitAbility,
  fallback = null,
  children,
}: AuthGuardProps) {
  const tableContext = useContext(DataTableContext);
  const caslAbility = useOptionalAbility();

  const ability = explicitAbility === undefined ? caslAbility : explicitAbility;
  const subject = explicitSubject || tableContext?.subject;

  if (!ability || !subject) {
    // Fail-Closed: 缺少权限实例或实体名时拒绝展示
    return fallback ? <>{fallback}</> : null;
  }

  const allowed = ability.can(action, subject, field);

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
