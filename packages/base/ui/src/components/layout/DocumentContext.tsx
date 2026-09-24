"use client";

import * as React from "react";

export type DocumentMode = "create" | "edit" | "view";

export interface DocumentContextValue {
	/** 当前单据模式 */
	readonly mode: DocumentMode;
	/** 当前单据是否处于只读/冻结状态 (view 模式或业务已锁定) */
	readonly isReadonly: boolean;
	/** 关联的 CASL 权限主体 (Subject) */
	readonly subject?: string;
	/** 业务单据唯一标识 */
	readonly documentId?: string;
	/** 业务单据编号 (如 BOM-2025-001) */
	readonly documentNumber?: string;
	/** 当前是否正在提交保存 */
	readonly isSubmitting: boolean;
}

export const DocumentContext = React.createContext<DocumentContextValue | null>(null);

/**
 * 获取当前单据工作台上下文 (可选安全读取)
 * 返回 null 表示当前组件不在 <DocumentShell /> 树中
 */
export function useOptionalDocumentContext(): DocumentContextValue | null {
	return React.useContext(DocumentContext);
}

/**
 * 获取当前单据工作台上下文 (强制要求存在外壳)
 */
export function useDocumentContext(): DocumentContextValue {
	const context = React.useContext(DocumentContext);
	if (!context) {
		throw new Error(
			"useDocumentContext must be used within a <DocumentShell /> container.",
		);
	}
	return context;
}
