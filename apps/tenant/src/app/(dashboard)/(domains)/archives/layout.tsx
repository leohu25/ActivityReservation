import React from "react";
import { BaseArchivesAbilityBoundary } from "@domain/base-archives/shared";
import { TenantDictItemSubject } from "@domain/base-archives/dict";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 基础档案 (Base Archives) 业务切片专属 CASL 布局边界。
 * 遵循架构铁律：谁的业务切片，谁的父级 Layout 挂载谁专属的 *AbilityBoundary，严禁借道寄生。
 */
export default async function ArchivesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const dictPerms = await getTenantSubjectPermissions(TenantDictItemSubject);

	return (
		<BaseArchivesAbilityBoundary
			permissions={{
				dict: dictPerms,
			}}
		>
			{children}
		</BaseArchivesAbilityBoundary>
	);
}
