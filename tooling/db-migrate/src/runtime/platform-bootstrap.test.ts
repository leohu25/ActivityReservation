import assert from "node:assert/strict";
import test from "node:test";
import type pg from "pg";
import {
  platformBootstrapAdminFromEnv,
  seedPlatformBootstrapAdmin,
} from "./platform-bootstrap";

test("platform bootstrap input is absent when no protected variables are configured", () => {
  assert.equal(platformBootstrapAdminFromEnv({}), undefined);
});

test("platform bootstrap input normalizes the environment contract", () => {
  assert.deepEqual(
    platformBootstrapAdminFromEnv({
      CONTROL_BOOTSTRAP_ADMIN_EMAIL: "Admin@Example.com",
      CONTROL_BOOTSTRAP_ADMIN_NAME: " Platform Admin ",
      CONTROL_BOOTSTRAP_ADMIN_PASSWORD: "secret-value",
    }),
    {
      email: "Admin@Example.com",
      name: "Platform Admin",
      password: "secret-value",
    },
  );
});

test("platform bootstrap seed is idempotent and stores a Better Auth hash", async () => {
  const users = new Map<string, string>();
  const accounts = new Map<string, string>();
  const client = {
    async query<T = unknown>(sql: string, params: readonly unknown[] = []) {
      if (sql.includes('FROM "user"')) {
        const id = users.get(String(params[0]));
        return { rows: (id ? [{ id }] : []) as T[] };
      }
      if (sql.includes('INSERT INTO "user"')) {
        users.set(String(params[2]), String(params[0]));
      }
      if (sql.includes('FROM "account"')) {
        const id = accounts.get(String(params[0]));
        return { rows: (id ? [{ id }] : []) as T[] };
      }
      if (sql.includes('INSERT INTO "account"')) {
        accounts.set(String(params[1]), String(params[0]));
        assert.notEqual(params[2], "bootstrap-password");
        assert.equal(typeof params[2], "string");
      }
      return { rows: [] as T[] };
    },
  } as unknown as pg.Client;
  const input = {
    email: "admin@example.com",
    name: "Admin",
    password: "bootstrap-password",
  };

  await seedPlatformBootstrapAdmin(client, input);
  await seedPlatformBootstrapAdmin(client, input);

  assert.equal(users.size, 1);
  assert.equal(accounts.size, 1);
});
