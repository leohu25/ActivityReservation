import test from "node:test";
import assert from "node:assert/strict";
import { generateDateSerialCode } from "./code-generator";

test("generateDateSerialCode: 空记录时生成第一号流水码", () => {
	const code = generateDateSerialCode({
		prefix: "CUST",
		now: new Date("2026-04-08T00:00:00Z"),
	});
	assert.equal(code, "CUST-20260408-0001");
});

test("generateDateSerialCode: 基于上一条记录顺序自增递增", () => {
	const code = generateDateSerialCode({
		prefix: "CUST",
		latestCode: "CUST-20260408-0042",
		now: new Date("2026-04-08T00:00:00Z"),
	});
	assert.equal(code, "CUST-20260408-0043");
});

test("generateDateSerialCode: 跨日期时自动重置为 0001", () => {
	const code = generateDateSerialCode({
		prefix: "CUST",
		latestCode: "CUST-20260407-0099", // 前一天的编码
		now: new Date("2026-04-08T00:00:00Z"),
	});
	assert.equal(code, "CUST-20260408-0001");
});

test("generateDateSerialCode: 支持下划线分隔符与自定义位数 (TAG_YYYYMMDD_XXXX)", () => {
	const code = generateDateSerialCode({
		prefix: "TAG",
		separator: "_",
		digits: 4,
		latestCode: "TAG_20260408_0005",
		now: new Date("2026-04-08T00:00:00Z"),
	});
	assert.equal(code, "TAG_20260408_0006");
});

test("generateDateSerialCode: 支持无日期纯前缀流水号", () => {
	const code = generateDateSerialCode({
		prefix: "CAT",
		datePattern: "NONE",
		latestCode: "CAT-0008",
	});
	assert.equal(code, "CAT-0009");
});
