import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTenantStorageKey,
  computePublicFileUrl,
  generatePresignedUploadUrl,
  getStorageConfig,
} from "./index";
import { ALLOWED_IMAGE_MIME_TYPES } from "./constants";

test("buildTenantStorageKey: 生成严格多租户前缀的存储 Key", () => {
  const key = buildTenantStorageKey("tenant_abc123", "employee", "avatar.png");
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  assert.ok(
    key.startsWith(`tenants/tenant_abc123/employee/${year}/${month}/`),
    `key 应包含租户隔离路径: ${key}`,
  );
  assert.ok(key.endsWith(".png"), `key 应保留扩展名: ${key}`);
});

test("buildTenantStorageKey: 拦截非法模块名与高危后缀", () => {
  // 非法模块名
  assert.throws(
    () => buildTenantStorageKey("tenant_1", "invalid/module", "pic.jpg"),
    /模块标识/,
  );

  // 高危 SVG 后缀
  assert.throws(
    () => buildTenantStorageKey("tenant_1", "employee", "xss.svg"),
    /安全策略禁止上传/,
  );

  // 高危 HTML 后缀
  assert.throws(
    () => buildTenantStorageKey("tenant_1", "employee", "hack.html"),
    /安全策略禁止上传/,
  );
});

test("computePublicFileUrl: 兼容 Path-Style 与 Virtual-Hosted 风格", () => {
  const minioConfig = {
    endpoint: "http://127.0.0.1:9000",
    region: "us-east-1",
    bucket: "my-bucket",
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
    forcePathStyle: true,
    publicDomain: "http://127.0.0.1:9000",
  };

  const minioUrl = computePublicFileUrl(minioConfig, "tenants/t1/avatar.jpg");
  assert.equal(
    minioUrl,
    "http://127.0.0.1:9000/my-bucket/tenants/t1/avatar.jpg",
  );

  const ossConfig = {
    ...minioConfig,
    forcePathStyle: false,
    publicDomain: "https://static.company.com",
  };

  const ossUrl = computePublicFileUrl(ossConfig, "tenants/t1/avatar.jpg");
  assert.equal(ossUrl, "https://static.company.com/tenants/t1/avatar.jpg");
});

test("generatePresignedUploadUrl: 成功生成直传预签名 URL 与元数据", async () => {
  const res = await generatePresignedUploadUrl({
    tenantId: "tenant_demo",
    module: "employee",
    fileName: "id_photo.jpg",
    mimeType: "image/jpeg",
    fileSize: 1024 * 100, // 100KB
  });

  assert.ok(res.uploadUrl.includes("http://127.0.0.1:9000"));
  assert.ok(res.uploadUrl.includes("X-Amz-Signature"));
  assert.ok(res.storageKey.startsWith("tenants/tenant_demo/employee/"));
  assert.ok(res.fileUrl.includes("tenants/tenant_demo/employee/"));
  assert.equal(res.expiresIn, 600);
});

test("generatePresignedUploadUrl: 拦截超大文件与高危类型", async () => {
  await assert.rejects(
    async () =>
      generatePresignedUploadUrl({
        tenantId: "tenant_demo",
        module: "employee",
        fileName: "large.jpg",
        mimeType: "image/jpeg",
        fileSize: 100 * 1024 * 1024, // 100MB
      }),
    /超出允许范围/,
  );

  await assert.rejects(
    async () =>
      generatePresignedUploadUrl({
        tenantId: "tenant_demo",
        module: "employee",
        fileName: "evil.svg",
        mimeType: "image/svg+xml",
        fileSize: 1024,
      }),
    /安全策略禁止上传|安全策略拦截/,
  );
});
