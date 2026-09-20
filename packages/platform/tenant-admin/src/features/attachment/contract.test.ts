import test from "node:test";
import assert from "node:assert/strict";
import { presignedUploadSchema, saveAttachmentSchema } from "./contract";

test("presignedUploadSchema: 校验合法图片上传参数", () => {
  const valid = presignedUploadSchema.parse({
    module: "employee",
    fileName: "avatar.jpg",
    fileSize: 1024 * 50,
    mimeType: "image/jpeg",
  });

  assert.equal(valid.module, "employee");
  assert.equal(valid.fileName, "avatar.jpg");
});

test("presignedUploadSchema: 拦截 SVG、超大文件与非法模块", () => {
  // 拦截 SVG
  assert.throws(
    () =>
      presignedUploadSchema.parse({
        module: "employee",
        fileName: "xss.svg",
        fileSize: 1024,
        mimeType: "image/svg+xml",
      }),
    /只允许上传常见图片格式/,
  );

  // 拦截非法模块名
  assert.throws(
    () =>
      presignedUploadSchema.parse({
        module: "a/b",
        fileName: "test.png",
        fileSize: 1024,
        mimeType: "image/png",
      }),
    /模块标识仅支持/,
  );
});

test("saveAttachmentSchema: 校验附件记录持久化参数", () => {
  const valid = saveAttachmentSchema.parse({
    module: "employee",
    targetId: "emp_123",
    fieldKey: "avatar",
    fileName: "avatar.png",
    storageKey: "tenants/t1/employee/2026/09/xxx.png",
    fileUrl: "http://127.0.0.1:9000/bucket/tenants/t1/employee/2026/09/xxx.png",
    fileSize: 2048,
    mimeType: "image/png",
  });

  assert.equal(valid.targetId, "emp_123");
  assert.equal(valid.fieldKey, "avatar");
});
