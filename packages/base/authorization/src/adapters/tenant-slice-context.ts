import { cache } from "react";
import { headers } from "next/headers";
import {
	getCurrentTenantContext,
	getServerAuthRuntime,
	assertTenantAccessGate,
	type TenantContext,
} from "@base/auth";
import {
	getTenantDbManager,
	resolveTenantEmployeeTopology,
	type TenantPrismaClient,
	type ResolvedDepartmentTopology,
} from "@base/db-tenant";
import { ForbiddenError } from "@casl/ability";
import {
	CaslAbilityFactory,
	type AppAbility,
	type AppPrismaAbility,
} from "../ability/ability-factory";
import type { PermissionCatalog, PermissionDefinition } from "../core/catalog";

export interface SharedTenantDbContext {
	readonly organizationId: string;
	readonly userId: string;
	readonly memberId: string;
	readonly role: string;
	readonly client: TenantPrismaClient;
	readonly tenantCtx: TenantContext;
	readonly employeeProfile: {
		readonly id: string;
		readonly memberId: string | null;
		readonly departmentId: string | null;
		readonly employeeNo: string | null;
		readonly jobTitle: string | null;
		readonly status: string;
	} | null;
}

/**
 * 纯技术底层：解析并获取当前租户物理数据库客户端与员工准入门禁校验。
 * 内置 React.cache()：同一次 RSC/Action 请求生命周期内多次调用零重复查库与解密。
 */
export const getSharedTenantDbContext = cache(
	async (): Promise<SharedTenantDbContext> => {
		const reqHeaders = await headers();
		const tenantCtx = await getCurrentTenantContext(reqHeaders);
		const runtime = getServerAuthRuntime();

		const manager = getTenantDbManager({
			repository: runtime.tenantContextRepository,
		});

		const tenantPrisma = await manager.getClient(tenantCtx.organizationId);
		const employeeProfile = await tenantPrisma.employeeProfile.findUnique({
			where: { memberId: tenantCtx.member.id },
			select: {
				id: true,
				memberId: true,
				departmentId: true,
				employeeNo: true,
				jobTitle: true,
				status: true,
			},
		});

		// 严格执行员工准入门禁 (Fail-Closed)
		if (employeeProfile) {
			assertTenantAccessGate(employeeProfile);
		}

		return {
			organizationId: tenantCtx.organizationId,
			userId: tenantCtx.user.id,
			memberId: tenantCtx.member.id,
			role: tenantCtx.member.role,
			client: tenantPrisma,
			tenantCtx,
			employeeProfile,
		};
	},
);

export interface TenantSliceContext<
	Action extends string = string,
	Subject extends string = string,
> extends SharedTenantDbContext {
	readonly ability: AppPrismaAbility<Action, Subject>;
	readonly topology: ResolvedDepartmentTopology;
}

export interface TenantSliceContextFactory<
	Action extends string = string,
	Subject extends string = string,
> {
	getContext: () => Promise<TenantSliceContext<Action, Subject>>;
	assertAbility: (
		ability: AppAbility<string, string>,
		action: Action,
		subject: Subject,
	) => void;
}

/**
 * Next.js App Router 官方标准推荐的切片装配高阶工厂 (Higher-Order Slice Context Factory)
 * 遵循 ADR-006 & Vertical Slice 规范：
 * 1. 消除业务切片重复手写 DB、拓扑解析与 CASL 初始化的 80% 样板代码；
 * 2. 结合 React.cache()：单次请求内相同切片多次提取共享同一个编译后的 Ability；
 * 3. 严格端到端类型安全：根据切片传入的 PermissionCatalog 自动约束 Action 与 Subject。
 */
export function createTenantSliceContext<
	Action extends string = string,
	Subject extends string = string,
	TDefinitions extends readonly PermissionDefinition[] = readonly PermissionDefinition[],
>(
	catalog: PermissionCatalog<TDefinitions>,
): TenantSliceContextFactory<Action, Subject> {
	const getContext = cache(
		async (): Promise<TenantSliceContext<Action, Subject>> => {
			const dbCtx = await getSharedTenantDbContext();
			const runtime = getServerAuthRuntime();

			const topology = await resolveTenantEmployeeTopology(dbCtx.client, {
				userId: dbCtx.userId,
				memberId: dbCtx.memberId,
			});

			const factory = new CaslAbilityFactory(
				runtime.tenantContextRepository,
				catalog,
			);
			const ability = (await factory.createPrismaAbilityForTenant(
				dbCtx.tenantCtx,
				topology,
			)) as AppPrismaAbility<Action, Subject>;

			return {
				...dbCtx,
				ability,
				topology,
			};
		},
	);

	function assertAbility(
		ability: AppAbility<string, string>,
		action: Action,
		subject: Subject,
	): void {
		ForbiddenError.from(ability).throwUnlessCan(action, subject);
	}

	return {
		getContext,
		assertAbility,
	};
}
