import test from "node:test";
import assert from "node:assert/strict";
import { retryOnUniqueConflict, isPrismaUniqueConstraintError } from "./retry";

test("retryOnUniqueConflict: 成功执行无需重试", async () => {
	let calls = 0;
	const res = await retryOnUniqueConflict(async () => {
		calls++;
		return "ok";
	});
	assert.equal(res, "ok");
	assert.equal(calls, 1);
});

test("retryOnUniqueConflict: 遇到非 P2002 错误直接中断，不进行重试", async () => {
	let calls = 0;
	await assert.rejects(
		async () => {
			await retryOnUniqueConflict(async () => {
				calls++;
				throw new Error("普通业务校验失败");
			});
		},
		{ message: "普通业务校验失败" },
	);
	assert.equal(calls, 1);
});

test("retryOnUniqueConflict: 遇到 P2002 唯一约束冲突执行退避重试并最终成功", async () => {
	let calls = 0;
	const p2002Error = Object.assign(new Error("Unique constraint failed"), {
		code: "P2002",
	});

	const res = await retryOnUniqueConflict(
		async () => {
			calls++;
			if (calls < 3) {
				throw p2002Error;
			}
			return "recovered";
		},
		{ retries: 3 },
	);

	assert.equal(res, "recovered");
	assert.equal(calls, 3);
});

test("retryOnUniqueConflict: 超过最大重试次数后抛出原错误", async () => {
	let calls = 0;
	const p2002Error = Object.assign(new Error("Unique constraint failed"), {
		code: "P2002",
	});

	await assert.rejects(
		async () => {
			await retryOnUniqueConflict(
				async () => {
					calls++;
					throw p2002Error;
				},
				{ retries: 2 },
			);
		},
		(err: any) => err.code === "P2002",
	);
	assert.equal(calls, 2);
});

test("isPrismaUniqueConstraintError 识别各种形式的错误对象", () => {
	assert.equal(isPrismaUniqueConstraintError({ code: "P2002" }), true);
	assert.equal(
		isPrismaUniqueConstraintError(
			Object.assign(new Error("failed"), { code: "P2002" }),
		),
		true,
	);
	assert.equal(isPrismaUniqueConstraintError({ code: "P2003" }), false);
	assert.equal(isPrismaUniqueConstraintError(null), false);
	assert.equal(isPrismaUniqueConstraintError("error"), false);
});
