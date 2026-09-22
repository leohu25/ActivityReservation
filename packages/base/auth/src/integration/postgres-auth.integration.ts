import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createServerAuth } from "../server/server";
import { createTrustedTenantContextResolver } from "../context/trusted-tenant-context";

const databaseUrl = process.env.CONTROL_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "CONTROL_DATABASE_URL is required for the PostgreSQL integration test",
  );
}

test("Better Auth Organization session resolves a real tenant context", {
  timeout: 30_000,
}, async () => {
  const unique = randomUUID().replaceAll("-", "");
  const email = `tenant-auth-${unique}@example.test`;
  const slug = `tenant-auth-${unique}`;
  const secretRef = `local-integration/${unique}`;
  const runtime = createServerAuth({
    databaseUrl,
    secret: "local-integration-secret-at-least-32-characters",
    baseURL: "http://127.0.0.1:3000",
  });
  let userId: string | undefined;
  let organizationId: string | undefined;

  try {
    const signUp = await runtime.auth.api.signUpEmail({
      returnHeaders: true,
      body: {
        name: `Integration ${unique}`,
        email,
        password: `Local-${unique}-Password!`,
      },
    });
    userId = signUp.response.user.id;
    const responseHeaders = signUp.headers;
    const setCookies = (
      responseHeaders as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie?.() ?? [responseHeaders.get("set-cookie") ?? ""];
    const cookie = setCookies
      .filter(Boolean)
      .map((value) => value.split(";", 1)[0])
      .join("; ");
    assert.ok(cookie);
    const sessionHeaders = new Headers({ cookie });

    const organization = await runtime.auth.api.createOrganization({
      headers: sessionHeaders,
      body: {
        name: `Integration ${unique}`,
        slug,
      },
    });
    assert.ok(organization);
    organizationId = organization.id;

    await runtime.auth.api.setActiveOrganization({
      headers: sessionHeaders,
      body: { organizationId },
    });

    const member = await runtime.prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    assert.ok(member);

    await runtime.prisma.tenantDatabase.create({
      data: {
        organizationId,
        clusterCode: "local-pg17",
        databaseName: `tenant_${unique}`,
        secretRef,
        schemaVersion: "integration-v1",
        status: "ACTIVE",
      },
    });

    const persistedSession = await runtime.auth.api.getSession({
      headers: sessionHeaders,
    });
    assert.equal(
      persistedSession?.session.activeOrganizationId,
      organizationId,
    );

    const resolveTrustedContext = createTrustedTenantContextResolver({
      sessionReader: {
        getSession: (input: { headers: Headers }) =>
          runtime.auth.api.getSession(input),
      },
      repository: runtime.tenantContextRepository,
    });
    const context = await resolveTrustedContext(sessionHeaders);

    assert.equal(context.user.id, userId);
    assert.equal(context.organizationId, organizationId);
    assert.equal(context.member.id, member.id);
    assert.equal(context.database.organizationId, organizationId);
    assert.equal(context.database.secretRef, secretRef);
    assert.equal(context.database.status, "ACTIVE");
  } finally {
    if (organizationId) {
      await runtime.prisma.tenantDatabase.deleteMany({
        where: { organizationId },
      });
      await runtime.prisma.member.deleteMany({
        where: { organizationId },
      });
      await runtime.prisma.organization.deleteMany({
        where: { id: organizationId },
      });
    }
    if (userId) {
      await runtime.prisma.member.deleteMany({ where: { userId } });
      await runtime.prisma.session.deleteMany({ where: { userId } });
      await runtime.prisma.account.deleteMany({ where: { userId } });
      await runtime.prisma.user.deleteMany({ where: { id: userId } });
    } else {
      await runtime.prisma.user.deleteMany({ where: { email } });
    }
    await runtime.prisma.verification.deleteMany({
      where: { identifier: email },
    });
    await runtime.prisma.$disconnect();
  }
});
