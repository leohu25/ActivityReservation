import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  createOrganizationAccessControl,
  createServerAuth,
  createTrustedTenantContextResolver,
} from "@chenrun/auth";
const testPermission = {
  resource: "authorization.test-order",
  subject: "AuthorizationTestOrder",
  actions: ["read", "create", "update", "audit"],
} as const;
const testStatement = {
  [testPermission.resource]: testPermission.actions,
} as const;
import { CaslAbilityFactory } from "../ability-factory";
import { createPermissionCatalog } from "../catalog";

const databaseUrl = process.env.CONTROL_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("CONTROL_DATABASE_URL is required for integration tests");
}

function sessionHeaders(responseHeaders: Headers): Headers {
  const setCookies = (
    responseHeaders as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.() ?? [responseHeaders.get("set-cookie") ?? ""];
  return new Headers({
    cookie: setCookies
      .filter(Boolean)
      .map((value) => value.split(";", 1)[0])
      .join("; "),
  });
}

test("dynamic PostgreSQL roles compile into an organization-isolated CASL ability", {
  timeout: 30_000,
}, async () => {
  const unique = randomUUID().replaceAll("-", "");
  const email = `authorization-${unique}@example.test`;
  const buyerRole = `buyer-${unique}`;
  const runtime = createServerAuth({
    databaseUrl,
    secret: "local-authorization-secret-at-least-32-characters",
    baseURL: "http://127.0.0.1:3000",
    organizationAccessControl: createOrganizationAccessControl(testStatement),
  });
  const organizationIds: string[] = [];
  let userId: string | undefined;

  try {
    const signUp = await runtime.auth.api.signUpEmail({
      returnHeaders: true,
      body: {
        name: `Authorization ${unique}`,
        email,
        password: `Local-${unique}-Password!`,
      },
    });
    userId = signUp.response.user.id;
    const headers = sessionHeaders(signUp.headers);

    const firstOrganization = await runtime.auth.api.createOrganization({
      headers,
      body: { name: `First ${unique}`, slug: `first-${unique}` },
    });
    assert.ok(firstOrganization);
    organizationIds.push(firstOrganization.id);

    await runtime.auth.api.createOrgRole({
      headers,
      body: {
        organizationId: firstOrganization.id,
        role: buyerRole,
        permission: {
          [testPermission.resource]: [
            testPermission.actions[0],
            testPermission.actions[1],
          ],
        },
      },
    });
    const secondOrganization = await runtime.auth.api.createOrganization({
      headers,
      body: { name: `Second ${unique}`, slug: `second-${unique}` },
    });
    assert.ok(secondOrganization);
    organizationIds.push(secondOrganization.id);
    await runtime.auth.api.createOrgRole({
      headers,
      body: {
        organizationId: secondOrganization.id,
        role: buyerRole,
        permission: {
          [testPermission.resource]: [testPermission.actions[3]],
        },
      },
    });

    await runtime.auth.api.setActiveOrganization({
      headers,
      body: { organizationId: firstOrganization.id },
    });
    await runtime.prisma.member.update({
      where: {
        organizationId_userId: {
          organizationId: firstOrganization.id,
          userId,
        },
      },
      data: { role: buyerRole },
    });
    await runtime.prisma.tenantDatabase.create({
      data: {
        organizationId: firstOrganization.id,
        clusterCode: "local-pg17",
        databaseName: `tenant_${unique}`,
        secretRef: `local-authorization/${unique}`,
        schemaVersion: "authorization-v1",
        status: "ACTIVE",
      },
    });

    const context = await createTrustedTenantContextResolver({
      sessionReader: {
        getSession: (input) => runtime.auth.api.getSession(input),
      },
      repository: runtime.tenantContextRepository,
    })(headers);
    const catalog = createPermissionCatalog([testPermission] as const);
    const ability = await new CaslAbilityFactory(
      runtime.tenantContextRepository,
      catalog,
    ).createForTenant(context);

    assert.equal(
      ability.can(testPermission.actions[0], testPermission.subject),
      true,
    );
    assert.equal(
      ability.can(testPermission.actions[1], testPermission.subject),
      true,
    );
    assert.equal(
      ability.can(testPermission.actions[3], testPermission.subject),
      false,
    );

    const persistedRoles = await runtime.prisma.organizationRole.findMany({
      where: { role: buyerRole },
      orderBy: { organizationId: "asc" },
    });
    assert.equal(persistedRoles.length, 2);
    assert.notEqual(
      persistedRoles[0]?.organizationId,
      persistedRoles[1]?.organizationId,
    );
  } finally {
    for (const organizationId of organizationIds) {
      await runtime.prisma.tenantDatabase.deleteMany({
        where: { organizationId },
      });
      await runtime.prisma.invitation.deleteMany({ where: { organizationId } });
      await runtime.prisma.member.deleteMany({ where: { organizationId } });
      await runtime.prisma.organizationRole.deleteMany({
        where: { organizationId },
      });
      await runtime.prisma.organization.deleteMany({
        where: { id: organizationId },
      });
    }
    if (userId) {
      await runtime.prisma.session.deleteMany({ where: { userId } });
      await runtime.prisma.account.deleteMany({ where: { userId } });
      await runtime.prisma.user.deleteMany({ where: { id: userId } });
    }
    await runtime.prisma.verification.deleteMany({
      where: { identifier: email },
    });
    await runtime.prisma.$disconnect();
  }
});
