"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@base/auth/client";
import {
  toast,
  useSafeRouter,
  Input,
  Button,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ThemeToggle,
} from "@base/ui";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";

/**
 * 平台控制平面超级管理员登录/注册页面组件 (FDD 自包含切片)
 * 遵循技术中立与主题语义变量驱动架构，全面支持明暗主题（Light/Dark）自适应与一键切换
 */
function parseFriendlyErrorMessage(err: unknown): string {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  // 数据库连接失败（ECONNREFUSED / P1001 / 服务宕机）
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("database server at") ||
    message.includes("fetch failed")
  ) {
    return "无法连接数据库：请确认本地数据库容器已启动，并已在 apps/control/.env.local 配置正确的 CONTROL_DATABASE_URL。";
  }

  if (
    message.includes("Invalid login credentials") ||
    message.includes("INVALID_EMAIL_OR_PASSWORD")
  ) {
    return "登录失败：超管邮箱或密码错误。";
  }

  return message || "认证服务网络异常，请检查数据库服务状态。";
}

export function ControlLogin(): React.JSX.Element {
  const router = useSafeRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const showError = (msg: string) => {
      setError(msg);
      toast.error(msg);
    };

    try {
      if (isRegister) {
        const res = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) {
          const msg =
            res.error.message?.includes("ECONNREFUSED") ||
            res.error.message?.includes("Can't reach database")
              ? "无法连接数据库：请确认本地数据库容器已启动且配置正确。"
              : res.error.message || "注册失败，请检查输入格式";
          showError(msg);
        } else {
          toast.success("注册成功，正在进入控制平面...");
          router?.push("/workbench");
          router?.refresh();
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          const msg =
            res.error.message?.includes("ECONNREFUSED") ||
            res.error.message?.includes("Can't reach database")
              ? "无法连接数据库：请确认本地数据库容器已启动且配置正确。"
              : res.error.message || "登录失败，超管邮箱或密码错误";
          showError(msg);
        } else {
          toast.success("登录成功，欢迎回到控制平面");
          router?.push("/workbench");
          router?.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = parseFriendlyErrorMessage(err);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 font-sans antialiased text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* 顶部右侧主题模式切换挂载区 */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <ThemeToggle />
      </header>

      {/* 科技感自适应光晕背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-[520px] w-[520px] rounded-full bg-primary/10 blur-[130px] dark:bg-primary/15" />
        <div className="absolute top-1/4 -left-20 h-[320px] w-[320px] rounded-full bg-sky-500/10 blur-[100px] dark:bg-sky-500/15" />
        <div className="absolute bottom-1/4 -right-20 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/15" />
      </div>

      {/* 核心登录/注册卡片 */}
      <Card className="w-full max-w-md border-border/80 bg-card/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/50 text-card-foreground transition-colors duration-200">
        {/* 头部品牌与中立平台 Logo */}
        <CardHeader className="text-center p-0 pb-6">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-background/80 p-2 shadow-lg shadow-primary/10 backdrop-blur-xs ring-1 ring-border/50"
            aria-label="控制平面平台中枢标识"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.png"
              alt="控制平面平台中枢标识"
              className="size-full object-contain"
            />
          </div>
          <CardTitle className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {isRegister ? "注册总控超级管理员" : "控制平面超级管理员登录"}
          </CardTitle>
          <CardDescription className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>Control Plane Super Admin 认证中心</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* 错误警告条 */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive/40 dark:bg-destructive/15">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* 表单主体 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-name"
                  className="flex items-center gap-1.5 text-xs font-bold text-foreground"
                >
                  <User className="size-3.5 text-muted-foreground" />
                  <span>超管姓名 / 备注</span>
                </Label>
                <Input
                  id="admin-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：平台总架构师"
                  className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="admin-email"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                <span>超管邮箱地址</span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@qq.com"
                className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                提示：默认平台超管邮箱为{" "}
                <code className="font-mono text-primary font-semibold">
                  admin@qq.com
                </code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="admin-password"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                <span>访问密码</span>
              </Label>
              <Input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10.5 mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>正在验证超级管理员凭证...</span>
                </>
              ) : (
                <span>
                  {isRegister ? "立即注册总控管理员" : "进入控制平面大盘"}
                </span>
              )}
            </Button>
          </form>

          {/* 注册/登录切换 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              {isRegister
                ? "已有平台管理员账号？直接登录"
                : "首次部署？注册初始超级管理员账号"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 底部版权与架构定位标识 */}
      <footer className="mt-8 text-center text-[11px] text-muted-foreground/80">
        <span>多租户 SaaS 基础设施 · 控制平面 (Control Plane)</span>
      </footer>
    </div>
  );
}
