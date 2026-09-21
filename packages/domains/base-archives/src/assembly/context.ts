import { cache } from "react";
import { getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory, type AppPrismaAbility } from "@base/authorization";
import { resolveEmployeeTopology } from "@base/db-tenant";
import { baseArchivesCatalog } from "../catalog";
import {
	getTenantDbContext,
	assertBaseArchivesAbility,
	type TenantDbContext,
} from "../shared/server/tenant-context";

export interface TenantBaseArchivesContext extends TenantDbContext {
	readonly ability: AppPrismaAbility<string, string>;
}

/**
 * 业务区域装配层：组合租户 DB 上下文与 Base Archives 权限目录。
 * React.cache() 无参记忆化：同请求内 Query/Action 共享同一 Ability 实例。
 */
export const getTenantBaseArchivesContext = cache(
	async (): Promise<TenantBaseArchivesContext> => {
		const dbCtx = await getTenantDbContext();
		const runtime = getServerAuthRuntime();

		const topology = await resolveEmployeeTopology(
			{
				findEmployeeProfile: async (memberId: string) => {
					return dbCtx.client.employeeProfile.findUnique({
						where: { memberId },
						select: {
							id: true,
							memberId: true,
							departmentId: true,
							employeeNo: true,
							jobTitle: true,
							status: true,
						},
					});
				},
				findAllDepartments: async () => {
					return dbCtx.client.department.findMany({
						select: { id: true, parentId: true },
					});
				},
			},
			{
				userId: dbCtx.userId,
				memberId: dbCtx.memberId,
			},
		);

		const factory = new CaslAbilityFactory(
			runtime.tenantContextRepository,
			baseArchivesCatalog,
		);
		const ability = (await factory.createPrismaAbilityForTenant(
			dbCtx.tenantCtx,
			topology,
		)) as AppPrismaAbility<string, string>;

		return {
			...dbCtx,
			ability,
		};
	},
);

export { assertBaseArchivesAbility };
