import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { MasterDataStatus } from "@base/shared";
import type { PrismaQueryCondition } from "@base/authorization";
import type {
	CreateStoreInput,
	ListStoreFilter,
	UpdateStoreInput,
} from "./types";

export type StorePrismaItem = Awaited<
	ReturnType<TenantPrismaClient["customerStore"]["findMany"]>
>[number] & {
	customer?: {
		id: string;
		name: string;
		status: string;
	} | null;
};

export interface ListStoresResult {
	items: StorePrismaItem[];
	total: number;
	page: number;
	pageSize: number;
}

export class CustomerStoreService {
	/**
	 * 门店列表查询（服务端分页：count + skip/take，严格过滤软删除并下推行级数据范围）
	 */
	static async listStores(
		client: TenantPrismaClient,
		filter: ListStoreFilter = {},
		accessibleWhere?: PrismaQueryCondition,
	): Promise<ListStoresResult> {
		const page = Math.max(1, filter.page ?? 1);
		const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 10));
		const skip = (page - 1) * pageSize;

		const andConditions: TenantPrisma.CustomerStoreWhereInput[] = [
			{ isDeleted: false },
		];

		if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
			andConditions.push(
				accessibleWhere as TenantPrisma.CustomerStoreWhereInput,
			);
		}

		if (filter.customerId) {
			andConditions.push({ customerId: filter.customerId });
		}
		if (filter.regionCode) {
			andConditions.push({ regionCode: filter.regionCode });
		}
		if (filter.status) {
			andConditions.push({ status: filter.status });
		}
		if (filter.keyword) {
			const q = filter.keyword.trim().slice(0, 100);
			andConditions.push({
				OR: [
					{ name: { contains: q, mode: "insensitive" } },
					{ address: { contains: q, mode: "insensitive" } },
					{ contactPerson: { contains: q, mode: "insensitive" } },
					{ customer: { name: { contains: q, mode: "insensitive" } } },
				],
			});
		}

		const where = { AND: andConditions };

		const [total, items] = await Promise.all([
			client.customerStore.count({ where }),
			client.customerStore.findMany({
				where,
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							status: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: pageSize,
			}),
		]);

		return { items, total, page, pageSize };
	}

	/**
	 * 获取单条门店详情
	 */
	static async getStore(
		client: TenantPrismaClient,
		id: string,
		accessibleWhere?: PrismaQueryCondition,
	) {
		const andConditions: TenantPrisma.CustomerStoreWhereInput[] = [
			{ id },
			{ isDeleted: false },
		];
		if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
			andConditions.push(
				accessibleWhere as TenantPrisma.CustomerStoreWhereInput,
			);
		}

		return client.customerStore.findFirst({
			where: { AND: andConditions },
			include: {
				customer: true,
				quotes: {
					where: { isDeleted: false },
					select: {
						id: true,
						quoteNo: true,
						status: true,
						createdAt: true,
					},
				},
			},
		});
	}

	/**
	 * 创建门店档案
	 */
	static async createStore(
		client: TenantPrismaClient,
		input: CreateStoreInput,
		auditCtx: { userId: string; deptId?: string | null },
	) {
		// 必须关联已存在的有效客户档案
		const customer = await client.customer.findUnique({
			where: { id: input.customerId },
		});
		if (!customer || customer.isDeleted) {
			throw new Error(`所属客户 [${input.customerId}] 不存在`);
		}
		if (customer.status === MasterDataStatus.DISABLED) {
			throw new Error(`所属客户 [${customer.name}] 已停用，无法为其新建门店`);
		}

		if (!input.regionCode || input.regionCode.trim().length === 0) {
			throw new Error("所属区域编码 (regionCode) 为必填项，用于区域报价匹配");
		}

		return client.customerStore.create({
			data: {
				customerId: input.customerId,
				name: input.name,
				address: input.address,
				contactPerson: input.contactPerson,
				contactPhone: input.contactPhone,
				regionCode: input.regionCode,
				deliveryPeriod: input.deliveryPeriod || null,
				defaultRoute: input.defaultRoute || null,
				defaultDriver: input.defaultDriver || null,
				storeTags: input.storeTags || null,
				billingContact: input.billingContact || null,
				billingPhone: input.billingPhone || null,
				status: MasterDataStatus.ACTIVE,
				createdById: auditCtx.userId,
				deptId: auditCtx.deptId ?? null,
				isDeleted: false,
			},
			include: {
				customer: true,
			},
		});
	}

	/**
	 * 更新门店档案
	 */
	static async updateStore(
		client: TenantPrismaClient,
		id: string,
		input: UpdateStoreInput,
		auditCtx?: { userId: string },
	) {
		const existing = await client.customerStore.findUnique({
			where: { id },
		});
		if (!existing || existing.isDeleted) {
			throw new Error(`门店 [${id}] 不存在`);
		}

		if (
			input.regionCode !== undefined &&
			(!input.regionCode || input.regionCode.trim().length === 0)
		) {
			throw new Error("所属区域编码 (regionCode) 不能为空");
		}

		return client.customerStore.update({
			where: { id },
			data: {
				name: input.name,
				address: input.address,
				contactPerson: input.contactPerson,
				contactPhone: input.contactPhone,
				regionCode: input.regionCode,
				deliveryPeriod: input.deliveryPeriod,
				defaultRoute: input.defaultRoute,
				defaultDriver: input.defaultDriver,
				storeTags: input.storeTags,
				billingContact: input.billingContact,
				billingPhone: input.billingPhone,
				status: input.status,
				updatedById: auditCtx?.userId ?? null,
			},
			include: {
				customer: true,
			},
		});
	}

	/**
	 * 变更门店状态
	 */
	static async updateStoreStatus(
		client: TenantPrismaClient,
		id: string,
		status: MasterDataStatus,
		auditCtx?: { userId: string },
	) {
		const store = await client.customerStore.findUnique({
			where: { id },
			include: { customer: true },
		});
		if (!store || store.isDeleted) {
			throw new Error(`门店 [${id}] 不存在`);
		}

		// 若试图启用门店，需确保客户也是启用状态
		if (
			status === MasterDataStatus.ACTIVE &&
			store.customer.status === MasterDataStatus.DISABLED
		) {
			throw new Error(
				`所属客户 [${store.customer.name}] 处于停用状态，无法单独启用该门店`,
			);
		}

		return client.customerStore.update({
			where: { id },
			data: {
				status,
				updatedById: auditCtx?.userId ?? null,
			},
		});
	}

	/**
	 * 软删除门店（已有报价单或订单的门店不允许删除）
	 */
	static async deleteStore(
		client: TenantPrismaClient,
		id: string,
		auditCtx?: { userId: string },
	) {
		const quoteCount = await client.customerQuote.count({
			where: { storeId: id, isDeleted: false },
		});
		if (quoteCount > 0) {
			throw new Error(`该门店已存在关联报价单记录，禁止删除，请进行“停用”操作`);
		}

		return client.customerStore.update({
			where: { id },
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				deletedById: auditCtx?.userId ?? null,
			},
		});
	}
}
