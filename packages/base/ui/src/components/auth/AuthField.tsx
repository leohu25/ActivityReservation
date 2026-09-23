"use client";

import type React from "react";
import { cloneElement, isValidElement, useContext } from "react";
import { FieldPolicy, type FieldAccessMode } from "@base/shared";
import { useUiAbility, type UiAbilityLike } from "./ui-ability-context";
import { Field, FieldLabel } from "../ui/field";
import { Badge } from "../ui/badge";
import { DataTableContext } from "../data-table/DataTableContext";

export type { FieldAccessMode } from "@base/shared";
export type AbilityLike = UiAbilityLike;

export interface AuthFieldProps {
	/** CASL Ability；未传则读 AbilityProvider（官方范式） */
	readonly ability?: AbilityLike | null;
	/** 实体名称；未传则从 DataTableContext 继承 subject */
	readonly subject?: string;
	/** 字段名 (如 'customerName', 'contactPhone') */
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
	readonly label?: React.ReactNode;
	/** 是否必填字段 (展示红色星号) */
	readonly required?: boolean;
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
	required,
	fallback = null,
	className,
}: AuthFieldProps) {
	const tableContext = useContext(DataTableContext);
	const contextAbility = useUiAbility();

	const ability =
		explicitAbility === undefined ? contextAbility : explicitAbility;
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
					<span className="inline-flex items-center gap-1">
						{(required ||
							(typeof label === "string" && label.trim().startsWith("*"))) && (
							<span
								className="text-destructive font-bold text-xs"
								aria-hidden="true"
							>
								*
							</span>
						)}
						<span>
							{typeof label === "string" && label.trim().startsWith("*")
								? label.trim().slice(1).trim()
								: label}
						</span>
					</span>
					{isReadOnly ? (
						<Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px]">
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
