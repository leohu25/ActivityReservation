/**
 * Node test runner custom reporter: 只输出失败用例与一行摘要。
 * 全绿时仅打印 `ok <pass>/<total>`，不刷成功用例明细。
 * 用法: tsx --test --test-reporter=<本文件绝对或相对路径> <测试文件...>
 */
export default async function* failOnlyReporter(source) {
  let pass = 0;
  let fail = 0;
  const failures = [];
  const diagnostics = [];

  for await (const event of source) {
    if (event.type === "test:pass") {
      pass += 1;
    } else if (event.type === "test:fail") {
      fail += 1;
      failures.push(event.data);
    } else if (event.type === "test:diagnostic") {
      // 丢弃 runner 自带的汇总诊断（tests/pass/fail/duration/...），只保留真错误
      const msg = String(event.data?.message ?? "");
      const isSummary =
        /^(tests|suites|pass|fail|cancelled|skipped|todo|duration_ms|plan)\b/i.test(
          msg,
        );
      if (!isSummary && /error|Error|ERR_/i.test(msg)) {
        diagnostics.push(msg);
      }
    }
  }

  const total = pass + fail;

  for (const f of failures) {
    const name = f?.name ?? "(unnamed)";
    const file = f?.file ?? "";
    const loc = file ? ` (${file})` : "";
    const err = f?.details?.error;
    const message = String(err?.message ?? err?.code ?? err ?? "unknown error");
    let stack = err?.stack ? String(err.stack) : "";
    // 去掉与 message 重复的首行，只保留调用栈
    if (stack.startsWith(message)) {
      stack = stack.slice(message.length);
    }
    const frames = stack
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.includes("node:internal") && !l.startsWith("Error"))
      .slice(0, 8);
    yield `✗ FAIL ${name}${loc}\n  ${message}\n`;
    for (const fr of frames) yield `    ${fr}\n`;
    yield "\n";
  }

  for (const d of diagnostics) {
    yield `  · ${d}\n`;
  }

  if (fail === 0) {
    yield `ok ${pass}/${total}\n`;
  } else {
    yield `FAIL ${fail} failed / ${total} total (pass ${pass})\n`;
  }
}
