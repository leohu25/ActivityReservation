"use client";

import { type ReactNode, useContext } from "react";
import { useUiAbility, type UiAbilityLike } from "./ui-ability-context";
import { DataTableContext } from "../data-table/DataTableContext";
import { useOptionalDocumentContext } from "../layout/DocumentContext";

export interface AuthGuardProps {
	/** 实体名称，若未传则自动从 DataTableContext 或 DocumentShell 继承 */
	subject?: string;
	/** 权限动作名称 (如 'create', 'export', 'delete', 'update') */
	action: string;
	/** 受控字段 (可选) */
	field?: string;
	/** 自定义 Ability 实例，若未传则自动从 UI 上下文或 DataTableContext 继承 */
	ability?: UiAbilityLike | null;
	/** 无权限时的替代渲染内容，默认 null (直接隐藏) */
	fallback?: ReactNode;
	children: ReactNode;
}

/**
 * 判断动作是否属于会修改数据的写操作
 */
function isWriteAction(action: string): boolean {
	const normalized = action.toLowerCase();
	return (
		normalized === "create" ||
		normalized === "update" ||
		normalized === "delete" ||
		normalized === "publish" ||
		normalized === "modify" ||
		normalized === "remove"
	);
}

/**
 * 声明式权限门禁积木 (AuthGuard)
 * 依据当前 UI Ability 上下文自动判定是否渲染子元素。
 * 具备双重上下文感知能力：
 * 1. 自动继承 DataTableContext 或 DocumentShell 的 subject；
 * 2. 自动感知 DocumentShell 的只读态：当处于只读/view 模式时，写操作自动阻断隐藏，业务无需额外手写 !isView。
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
	const docContext = useOptionalDocumentContext();
	const contextAbility = useUiAbility();

	const ability =
		explicitAbility === undefined ? contextAbility : explicitAbility;
	const subject =
		explicitSubject || docContext?.subject || tableContext?.subject;

	// 单据只读穿透守卫：如果单据处于只读/查看态，且当前保护的是写操作，直接拒绝渲染
	if (docContext?.isReadonly && isWriteAction(action)) {
		return fallback ? <>{fallback}</> : null;
	}

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
