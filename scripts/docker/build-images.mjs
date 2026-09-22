#!/usr/bin/env node
/**
 * 跨平台 Docker 镜像交互式构建与打包脚本
 * 遵循全仓跨平台 Node.js (*.mjs) 规范，支持交互式选择目标架构并一键打包镜像
 */
import { spawnSync } from "node:child_process";
import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// 颜色工具输出
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

async function main() {
  console.log("\n" + cyan(bold("==================================================")));
  console.log(cyan(bold("      多租户 SaaS 平台 — Docker 生产镜像交互式打包      ")));
  console.log(cyan(bold("==================================================")) + "\n");

  // 1. 检查 Docker 是否可用
  const dockerCheck = spawnSync("docker", ["--version"], { encoding: "utf-8" });
  if (dockerCheck.status !== 0) {
    console.error(red("❌ 未检测到 Docker 环境，请确保 Docker 已安装并在运行中。"));
    process.exit(1);
  }
  console.log(green(`✔ 检测到 Docker 环境: ${dockerCheck.stdout.trim()}`));

  // 2. 交互式选择架构
  console.log("\n" + bold("请选择目标服务器的系统架构:"));
  console.log("  1) " + green("linux/amd64") + "  (常见 x86_64 云服务器，如阿里云/腾讯云/华为云标准机型)");
  console.log("  2) " + green("linux/arm64") + "  (ARM64 服务器，如鲲鹏、飞腾、苹果 M 系列、AWS Graviton)");
  console.log("  3) " + green("当前本地架构") + "  (不指定 platform，使用本地 Docker 默认架构构建)");

  let archChoice = await askQuestion(cyan("\n请输入选项 [1-3] (默认 1): "));
  archChoice = archChoice.trim() || "1";

  let platform = "";
  if (archChoice === "1") {
    platform = "linux/amd64";
  } else if (archChoice === "2") {
    platform = "linux/arm64";
  } else if (archChoice === "3") {
    platform = "";
  } else {
    console.log(yellow("⚠️ 无效选项，自动采用默认架构: linux/amd64"));
    platform = "linux/amd64";
  }

  // 3. 交互式选择打包模块
  console.log("\n" + bold("请选择要构建的镜像:"));
  console.log("  1) " + green("全部构建") + " (base-control + base-tenant)");
  console.log("  2) " + green("仅平台管控端") + " (base-control)");
  console.log("  3) " + green("仅租户业务端") + " (base-tenant)");

  let targetChoice = await askQuestion(cyan("\n请输入选项 [1-3] (默认 1): "));
  targetChoice = targetChoice.trim() || "1";

  const targets = [];
  if (targetChoice === "1") {
    targets.push(
      { name: "base-control:latest", file: "apps/control/Dockerfile", desc: "平台管控端" },
      { name: "base-tenant:latest", file: "apps/tenant/Dockerfile", desc: "租户业务端" }
    );
  } else if (targetChoice === "2") {
    targets.push({ name: "base-control:latest", file: "apps/control/Dockerfile", desc: "平台管控端" });
  } else if (targetChoice === "3") {
    targets.push({ name: "base-tenant:latest", file: "apps/tenant/Dockerfile", desc: "租户业务端" });
  } else {
    console.log(yellow("⚠️ 无效选项，自动构建全部镜像"));
    targets.push(
      { name: "base-control:latest", file: "apps/control/Dockerfile", desc: "平台管控端" },
      { name: "base-tenant:latest", file: "apps/tenant/Dockerfile", desc: "租户业务端" }
    );
  }

  // 4. 交互式询问是否在构建后打包导出为 tar.gz
  let exportChoice = await askQuestion(cyan("\n构建完成后是否自动压缩导出为 tar.gz 文件？ (y/n, 默认 y): "));
  const shouldExport = exportChoice.trim().toLowerCase() !== "n";

  // 5. 打印确认信息
  console.log("\n" + bold("--------------------------------------------------"));
  console.log(bold("构建配置摘要:"));
  console.log(`  • 目标架构:   ${platform ? green(platform) : green("本地系统架构 (默认)")}`);
  console.log(`  • 构建目标:   ${green(targets.map((t) => t.desc).join(" + "))}`);
  console.log(`  • 导出压缩包: ${shouldExport ? green("是 (app-images.tar.gz)") : yellow("否 (仅保留在 Docker 引擎中)")}`);
  console.log(bold("--------------------------------------------------") + "\n");

  let confirm = await askQuestion(cyan("确认开始构建？ (y/n, 默认 y): "));
  if (confirm.trim().toLowerCase() === "n") {
    console.log(yellow("已取消构建任务。"));
    rl.close();
    process.exit(0);
  }

  rl.close();

  // 6. 开始执行构建
  for (const target of targets) {
    console.log("\n" + cyan(bold(`🚀 正在构建 ${target.desc} [${target.name}]...`)));
    const args = ["build", "-t", target.name, "-f", target.file];
    if (platform) {
      args.push("--platform", platform);
    }
    args.push(".");

    const buildProcess = spawnSync("docker", args, {
      stdio: "inherit",
      encoding: "utf-8",
    });

    if (buildProcess.status !== 0) {
      console.error(red(`\n❌ ${target.desc} 构建失败，终止任务。`));
      process.exit(buildProcess.status ?? 1);
    }
    console.log(green(`✔ ${target.desc} 构建完成！`));
  }

  // 7. 导出压缩包
  if (shouldExport) {
    const archiveName = "app-images.tar.gz";
    console.log("\n" + cyan(bold(`📦 正在将构建的镜像打包压缩为 ${archiveName}...`)));

    const imageNames = targets.map((t) => t.name);
    // 使用管道在 node 端流式压缩，抹平不同平台对 gzip 命令的依赖
    import("node:zlib").then(({ createGzip }) => {
      import("node:child_process").then(({ spawn }) => {
        const dockerSave = spawn("docker", ["save", ...imageNames]);
        const gzip = createGzip({ level: 6 });
        const output = fs.createWriteStream(path.resolve(process.cwd(), archiveName));

        dockerSave.stdout.pipe(gzip).pipe(output);

        dockerSave.stderr.on("data", (data) => {
          process.stderr.write(data);
        });

        output.on("finish", () => {
          const stats = fs.statSync(path.resolve(process.cwd(), archiveName));
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(green(`\n✔ 镜像打包导出成功！文件大小: ${sizeMB} MB`));
          console.log(green(`✔ 文件路径: ${path.resolve(process.cwd(), archiveName)}`));
          console.log("\n" + cyan(bold("部署提示:")));
          console.log(`  1. 使用 scp 将 ${archiveName} 和 compose.prod.yaml 传至服务器`);
          console.log(`  2. 在服务器解压载入: gunzip -c ${archiveName} | docker load`);
          console.log(`  3. 启动集群: docker compose -f compose.prod.yaml up -d\n`);
        });

        output.on("error", (err) => {
          console.error(red(`❌ 打包压缩失败: ${err.message}`));
          process.exit(1);
        });
      });
    });
  } else {
    console.log("\n" + green(bold("🎉 所有镜像构建完成！\n")));
  }
}

main().catch((err) => {
  console.error(red(`\n❌ 执行异常: ${err.message}`));
  process.exit(1);
});
