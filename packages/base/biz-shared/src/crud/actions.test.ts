import test from "node:test";
import assert from "node:assert/strict";
import { createResourceActions } from "./actions";

test("createResourceActions：create 调用 schema 与 service（编排）", async () => {
  let parsedRaw: unknown = null;
  let serviceInput: unknown = null;

  const actions = createResourceActions({
    getContext: async () => ({
      client: { id: "db" },
      ability: { can: () => true, rules: [] },
      userId: "u1",
      deptId: "d1",
    }),
    subject: "Customer",
    controlledFields: [],
    assertAbility: () => undefined,
    revalidatePaths: [],
    schemas: {
      create: (raw) => {
        parsedRaw = raw;
        return { customerName: "N", categoryCode: "C" };
      },
    },
    service: {
      create: async (_client, input, ctx) => {
        serviceInput = { input, ctx };
        return { ok: true };
      },
    },
  });

  assert.ok(actions.create);
  const res = await actions.create!({ customerName: "N", categoryCode: "C" });
  assert.equal(res.success, true);
  assert.deepEqual(parsedRaw, { customerName: "N", categoryCode: "C" });
  assert.ok(serviceInput);
  const payload = serviceInput as {
    input: { customerName: string };
    ctx: { userId: string; deptId: string | null };
  };
  assert.equal(payload.input.customerName, "N");
  assert.equal(payload.ctx.userId, "u1");
  assert.equal(payload.ctx.deptId, "d1");
});

test("createResourceActions：未配置 service.create 时 create 为 undefined", () => {
  const actions = createResourceActions({
    getContext: async () => ({ client: null, ability: null, userId: "u" }),
    subject: "X",
    controlledFields: [],
    assertAbility: () => undefined,
    revalidatePaths: [],
    service: {},
  });
  assert.equal(actions.create, undefined);
  assert.equal(actions.update, undefined);
});
