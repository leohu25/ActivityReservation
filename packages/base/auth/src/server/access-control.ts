import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

export type ApplicationPermissionStatement = Record<
  string,
  readonly [string, ...string[]]
>;

/**
 * Composes feature-owned permissions with Better Auth's organization defaults.
 * Feature statements are injected by the application composition root so auth
 * never depends on a business feature package.
 */
export function createOrganizationAccessControl<
  const TStatement extends ApplicationPermissionStatement,
>(applicationStatement: TStatement) {
  for (const resource of Object.keys(applicationStatement)) {
    if (resource in defaultStatements) {
      throw new Error(
        `Application permission resource conflicts with Better Auth: ${resource}`,
      );
    }
  }

  const statement = {
    ...defaultStatements,
    ...applicationStatement,
  } as const;
  const ac = createAccessControl(statement);
  const memberApplicationStatement = Object.fromEntries(
    Object.keys(applicationStatement).map((resource) => [resource, []]),
  ) as { [TResource in keyof TStatement]: [] };

  return {
    ac,
    statement,
    applicationRolePermissions: {
      owner: applicationStatement,
      admin: applicationStatement,
      member: {},
    },
    roles: {
      owner: ac.newRole({
        ...ownerAc.statements,
        ...applicationStatement,
      }),
      admin: ac.newRole({
        ...adminAc.statements,
        ...applicationStatement,
      }),
      member: ac.newRole({
        ...memberAc.statements,
        ...memberApplicationStatement,
      }),
    },
  };
}

export interface OrganizationAccessControl {
  readonly ac: unknown;
  readonly roles: Readonly<Record<string, unknown>>;
  readonly applicationRolePermissions: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >;
}
