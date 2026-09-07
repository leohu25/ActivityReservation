/**
 * @chenrun/authorization
 * CASL 授权引擎集成、Ability Factory 与服务端门禁
 */

import type { DataScope, FieldPolicy } from "@chenrun/shared";

export type Action =
 | "read"
 | "create"
 | "update"
 | "delete"
 | "audit"
 | "export";
export type Subject = string;

export interface RoleDataScopeRecord {
 organizationId: string;
 roleName: string;
 resource: string;
 action: Action;
 scopeType: DataScope;
 scopeValueJson?: unknown;
}

export interface RoleFieldPolicyRecord {
 organizationId: string;
 roleName: string;
 subject: string;
 field: string;
 access: FieldPolicy;
}

export interface AbilityContext {
 userId: string;
 organizationId: string;
 deptId?: string;
 deptTreeIds?: string[];
 roles: string[];
}

export interface AppAbility {
 can(action: Action, subject: Subject, field?: string): boolean;
 cannot(action: Action, subject: Subject, field?: string): boolean;
}

export interface AbilityFactory {
 createForUser(ctx: AbilityContext): Promise<AppAbility>;
}
