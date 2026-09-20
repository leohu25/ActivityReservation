import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { ImageUpload } from "./ImageUpload";

test("ImageUpload: 空值初始态渲染点击上传与体积提示", () => {
  const html = renderToString(
    <ImageUpload
      module="employee"
      maxSizeMB={5}
    />,
  );

  assert.match(html, /点击上传/);
  assert.match(html, /小于.*5.*MB/);
});

test("ImageUpload: 存在已上传图片时渲染预览图与容器", () => {
  const html = renderToString(
    <ImageUpload
      value="http://127.0.0.1:9000/bucket/avatar.png"
      module="employee"
    />,
  );

  assert.match(html, /<img/);
  assert.match(html, /avatar\.png/);
});
