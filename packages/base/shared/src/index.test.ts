import assert from "node:assert/strict";
import test from "node:test";
import {
  // 错误体系
  AppError,
  BusinessError,
  NotFoundError,
  isAppError,
  // Result
  ok,
  err,
  isOk,
  isErr,
  tryCatch,
  unwrap,
  unwrapOr,
  // API
  apiSuccess,
  apiError,
  defineServerAction,
  // 分页
  normalizePagination,
  createPaginatedResult,
  // 格式化
  formatCurrency,
  formatPercent,
  compareMigrationVersions,
  computeSha256,
  parseMigrationFolderName,
  formatNumber,
  formatDate,
  formatDateTime,
  formatByteSize,
  // 脱敏
  maskPhone,
  maskEmail,
  maskIdCard,
  maskBankCard,
  maskName,
  // 树结构
  buildTree,
  flattenTree,
  findTreeNode,
  collectSubtreeIds,
  // 集合
  groupBy,
  keyBy,
  chunk,
  uniqBy,
  pick,
  omit,
  // 校验
  isValidUnifiedSocialCreditCode,
  isValidMobilePhone,
  isValidEmail,
  // 常量与枚举
  FieldPolicy,
  MasterDataStatus,
} from "./index";

test("Result 工具：支持 ok, err, isOk, isErr 与 unwrap", () => {
  const successRes = ok({ name: "晨润", id: 101 });
  assert.equal(isOk(successRes), true);
  assert.equal(isErr(successRes), false);
  assert.equal(unwrap(successRes).name, "晨润");
  assert.equal(unwrapOr(successRes, { name: "default", id: 0 }).id, 101);

  const failRes = err(new BusinessError("金额不能小于0"));
  assert.equal(isOk(failRes), false);
  assert.equal(isErr(failRes), true);
  assert.throws(() => unwrap(failRes), /金额不能小于0/);
  assert.equal(unwrapOr(failRes, { name: "兜底", id: 999 }).id, 999);

  // tryCatch 测试
  const caughtOk = tryCatch(() => JSON.parse('{"status": "ACTIVE"}'));
  assert.equal(isOk(caughtOk), true);
  if (isOk(caughtOk)) {
    assert.deepEqual(caughtOk.value, { status: "ACTIVE" });
  }

  const caughtErr = tryCatch(() => JSON.parse("invalid json"));
  assert.equal(isErr(caughtErr), true);
});

test("API 响应包装工厂：正确构造标准返回", () => {
  const success = apiSuccess({ token: "abc" }, { version: "1.0" });
  assert.equal(success.success, true);
  assert.equal(success.data.token, "abc");
  assert.equal(success.meta?.version, "1.0");

  const failure = apiError("ORDER_NOT_FOUND", "采购单不存在", 404, {
    orderNo: "PO-2026-001",
  });
  assert.equal(failure.success, false);
  assert.equal(failure.error.code, "ORDER_NOT_FOUND");
  assert.equal(failure.error.status, 404);
  assert.deepEqual(failure.error.details, { orderNo: "PO-2026-001" });
});

test("分页工具：标准化清洗参数与包装 PaginatedResult", () => {
  const p1 = normalizePagination();
  assert.equal(p1.page, 1);
  assert.equal(p1.pageSize, 20);
  assert.equal(p1.skip, 0);
  assert.equal(p1.take, 20);

  const p2 = normalizePagination({ page: 3, pageSize: 50 });
  assert.equal(p2.page, 3);
  assert.equal(p2.pageSize, 50);
  assert.equal(p2.skip, 100);
  assert.equal(p2.take, 50);

  const pOverflow = normalizePagination({ page: -5, pageSize: 999 });
  assert.equal(pOverflow.page, 1);
  assert.equal(pOverflow.pageSize, 100);

  const result = createPaginatedResult(["A", "B", "C"], 25, {
    page: 2,
    pageSize: 10,
  });
  assert.equal(result.total, 25);
  assert.equal(result.totalPages, 3);
  assert.equal(result.hasNext, true);
  assert.equal(result.hasPrev, true);
});

test("企业级格式化工具：货币、百分比、日期与容量", () => {
  assert.equal(formatCurrency(1234567.89), "¥ 1,234,567.89");
  assert.equal(
    formatCurrency(-5000, { symbol: "$", space: false }),
    "-$5,000.00",
  );
  assert.equal(formatCurrency(null), "¥ 0.00");

  test("迁移工具套件：版本号排序、哈希校验与文件夹解析", () => {
    const versions = ["20260909155730", "202609080001", "202609080002"];
    versions.sort(compareMigrationVersions);
    assert.deepEqual(versions, [
      "202609080001",
      "202609080002",
      "20260909155730",
    ]);

    const hash = computeSha256("SELECT 1;");
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);

    const parsed = parseMigrationFolderName(
      "202609080001_initial_tenant_schema",
    );
    assert.deepEqual(parsed, {
      version: "202609080001",
      name: "initial_tenant_schema",
    });

    assert.equal(parseMigrationFolderName("invalid_folder"), null);
  });

  assert.equal(formatPercent(0.125), "12.50%");
  assert.equal(formatPercent(15), "15.00%");
  assert.equal(formatPercent(null), "0.00%");

  assert.equal(formatNumber(12345678), "12,345,678");
  assert.equal(formatNumber(1234.5678, 2), "1,234.57");

  const fixedDate = new Date(2026, 8, 8, 14, 30, 45); // 2026-09-08 14:30:45
  assert.equal(formatDate(fixedDate), "2026-09-08");
  assert.equal(formatDateTime(fixedDate), "2026-09-08 14:30:45");

  assert.equal(formatByteSize(1024), "1.00 KB");
  assert.equal(formatByteSize(1024 * 1024 * 3.5), "3.50 MB");
});

test("敏感数据脱敏：手机号、邮箱、身份证与姓名", () => {
  assert.equal(maskPhone("13812345678"), "138****5678");
  assert.equal(maskEmail("admin@qq.com"), "a***@qq.com");
  assert.equal(maskIdCard("330102199001011234"), "330102********1234");
  assert.equal(maskBankCard("6222021234567890"), "6222 **** **** 7890");
  assert.equal(maskName("张三"), "张*");
  assert.equal(maskName("李大强"), "李*强");
  assert.equal(maskName("欧阳六六"), "欧**六");
});

test("树结构工具：扁平转嵌套、展开 depth、查找节点与防环子树收集", () => {
  const flatItems = [
    { id: "dept_root", name: "总公司", parentId: null },
    { id: "dept_rd", name: "研发中心", parentId: "dept_root" },
    { id: "dept_rd_fe", name: "前端组", parentId: "dept_rd" },
    { id: "dept_sales", name: "市场营销部", parentId: "dept_root" },
  ];

  const tree = buildTree(flatItems);
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.children.length, 2);
  assert.equal(tree[0]?.children[0]?.id, "dept_rd");
  assert.equal(tree[0]?.children[0]?.children.length, 1);

  // 扁平化展开
  const flattened = flattenTree(tree);
  assert.equal(flattened.length, 4);
  assert.equal(flattened[0]?.depth, 0);
  assert.equal(flattened[1]?.depth, 1);
  assert.equal(flattened[2]?.depth, 2);

  // 查找节点
  const found = findTreeNode(tree, (n) => n.id === "dept_rd_fe");
  assert.ok(found);
  assert.equal(found?.name, "前端组");

  // 收集子树 ID 集合
  const firstChild = tree[0]?.children?.[0];
  assert.ok(firstChild);
  const subtreeIds = collectSubtreeIds(firstChild);
  assert.deepEqual(subtreeIds.sort(), ["dept_rd", "dept_rd_fe"].sort());
});

test("集合操作纯函数：groupBy, keyBy, chunk, uniqBy, pick, omit", () => {
  const list = [
    { id: "1", role: "admin", name: "Alice" },
    { id: "2", role: "member", name: "Bob" },
    { id: "3", role: "admin", name: "Charlie" },
  ];

  const grouped = groupBy(list, (x) => x.role);
  assert.equal(grouped.admin?.length, 2);
  assert.equal(grouped.member?.length, 1);

  const indexed = keyBy(list, (x) => x.id);
  assert.equal(indexed["2"]?.name, "Bob");

  const chunks = chunk([1, 2, 3, 4, 5], 2);
  assert.deepEqual(chunks, [[1, 2], [3, 4], [5]]);

  const unique = uniqBy([{ k: 1 }, { k: 2 }, { k: 1 }], (x) => x.k);
  assert.equal(unique.length, 2);

  const picked = pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
  assert.deepEqual(picked, { a: 1, c: 3 });

  const omitted = omit({ a: 1, b: 2, c: 3 }, ["b"]);
  assert.deepEqual(omitted, { a: 1, c: 3 });
});

test("合规校验工具：统一社会信用代码、手机号与邮箱", () => {
  // 合法的统一社会信用代码 (例如华为技术有限公司真实代码：914403001922038216)
  assert.equal(isValidUnifiedSocialCreditCode("914403001922038216"), true);
  // 非法校验码
  assert.equal(isValidUnifiedSocialCreditCode("914403001922038219"), false);
  // 长度不对
  assert.equal(isValidUnifiedSocialCreditCode("12345"), false);

  // 手机号
  assert.equal(isValidMobilePhone("13812345678"), true);
  assert.equal(isValidMobilePhone("12812345678"), false);
  assert.equal(isValidMobilePhone("1381234567"), false);

  // 邮箱
  assert.equal(isValidEmail("test@example.com"), true);
  assert.equal(isValidEmail("invalid-email"), false);
});

test("异常与枚举：AppError 继承与枚举完备性", () => {
  const err = new NotFoundError("订单", "PO-100");
  assert.equal(isAppError(err), true);
  assert.equal(err.code, "NOT_FOUND");
  assert.equal(err.status, 404);

  assert.equal(FieldPolicy.EDITABLE, "EDITABLE");
  assert.equal(MasterDataStatus.ACTIVE, "ACTIVE");
  assert.equal(MasterDataStatus.DISABLED, "DISABLED");
});

test("defineServerAction: 统一安全包装与序列化，成功与异常全覆盖", async () => {
  const { Decimal } = await import("decimal.js");

  // 1. 成功且带 Decimal 的场景 (自动转换为 Plain Object)
  const actionWithDecimal = defineServerAction(
    async (prefix: string, rate: number) => {
      return {
        code: `${prefix}-001`,
        taxRate: new Decimal(rate),
        createdAt: new Date("2026-09-09T00:00:00.000Z"),
      };
    },
  );

  const successRes = await actionWithDecimal("CUST", 9.5);
  assert.equal(successRes.success, true);
  if (successRes.success) {
    assert.equal(successRes.data.code, "CUST-001");
    // 经由 toPlainData / superjson 序列化为 Plain 格式，不再是类实例
    assert.equal(typeof successRes.data.taxRate, "string");
    assert.equal(successRes.data.taxRate, "9.5");
  }

  // 2. 发生业务异常的场景 (自动捕获并返回标准错误契约)
  const failingAction = defineServerAction(async () => {
    throw new Error("客户编码已存在，禁止重复创建");
  });

  const failRes = await failingAction();
  assert.equal(failRes.success, false);
  if (!failRes.success) {
    assert.equal(failRes.error, "客户编码已存在，禁止重复创建");
  }
});
