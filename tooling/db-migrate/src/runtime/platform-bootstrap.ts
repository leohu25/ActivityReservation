import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type pg from "pg";
import type { PlatformBootstrapAdminInput } from "../core/types";

/**
 * Creates the Day 0 control-plane credential using Better Auth's password hash.
 * The email is also expected to be present in CONTROL_ADMIN_EMAILS so the
 * existing fail-closed control guard grants platform administration rights.
 */
export async function seedPlatformBootstrapAdmin(
  client: pg.Client,
  input: PlatformBootstrapAdminInput,
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const passwordHash = await hashPassword(input.password);

  const existingUser = await client.query<{ id: string }>(
    'SELECT "id" FROM "user" WHERE "email" = $1 LIMIT 1',
    [email],
  );
  const userId = existingUser.rows[0]?.id ?? `usr_${randomUUID()}`;
  if (existingUser.rows.length === 0) {
    await client.query(
      `INSERT INTO "user" (
        "id", "name", "email", "email_verified", "created_at", "updated_at"
      ) VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, name, email],
    );
  }

  const existingAccount = await client.query<{ id: string }>(
    `SELECT "id" FROM "account"
     WHERE "provider_id" = 'credential' AND "account_id" = $1
     LIMIT 1`,
    [userId],
  );
  if (existingAccount.rows.length === 0) {
    await client.query(
      `INSERT INTO "account" (
        "id", "account_id", "provider_id", "user_id", "password",
        "created_at", "updated_at"
      ) VALUES ($1, $2, 'credential', $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [`acc_${randomUUID()}`, userId, passwordHash],
    );
  }
}

export function platformBootstrapAdminFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PlatformBootstrapAdminInput | undefined {
  const email = env.CONTROL_BOOTSTRAP_ADMIN_EMAIL;
  const password = env.CONTROL_BOOTSTRAP_ADMIN_PASSWORD;
  if (!email && !password) return undefined;
  return {
    email: email ?? "",
    name: env.CONTROL_BOOTSTRAP_ADMIN_NAME?.trim() || "平台超级管理员",
    password: password ?? "",
  };
}
