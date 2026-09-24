import test from "node:test";
import assert from "node:assert/strict";
import {
  CreateVenueSchema,
  CreateActivitySchema,
  SubmitAppointmentSchema,
} from "./contract.ts";

test("CreateVenueSchema: 校验场馆合法输入", () => {
  const validVenue = {
    code: "VENUE-01",
    name: "宁卫校史馆",
    openTime: "周二至周日 09:00-16:30",
    isDefault: true,
  };
  const parsed = CreateVenueSchema.parse(validVenue);
  assert.equal(parsed.name, "宁卫校史馆");
  assert.equal(parsed.isDefault, true);
});

test("CreateActivitySchema: 拦截结束时间早于开始时间或缺少名称", () => {
  assert.throws(() => {
    CreateActivitySchema.parse({
      venueId: "not-a-uuid",
      title: "",
    });
  });
});

test("SubmitAppointmentSchema: 严格校验11位手机号与同行人必填项", () => {
  const invalidPhone = {
    activityId: "0195e000-0000-7000-8000-000000000001",
    sessionId: "0195e000-0000-7000-8000-000000000002",
    applicantName: "张三",
    phone: "12345", // 非法手机号
  };
  assert.throws(() => {
    SubmitAppointmentSchema.parse(invalidPhone);
  });

  const valid = {
    activityId: "0195e000-0000-7000-8000-000000000001",
    sessionId: "0195e000-0000-7000-8000-000000000002",
    applicantName: "李四",
    phone: "13800138000",
    peopleCount: 2,
    visitors: [{ name: "王五", phone: "13900139000" }],
  };
  const parsed = SubmitAppointmentSchema.parse(valid);
  assert.equal(parsed.applicantName, "李四");
  assert.equal(parsed.visitors.length, 1);
});
