"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  ThemeToggle,
} from "@base/ui";
import { Loader2, Building2, KeyRound, User } from "lucide-react";

/**
 * 租户端专属三要素登录界面 (企业编码 + 账号/手机号 + 密码)
 * 彻底消除跨租户重名串号与多租户二选一死锁
 */
export default function LoginPage() {
  const router = useRouter();
  const [orgSlug, setOrgSlug] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 提交三要素登录表单
   */
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 官方标准：直接调用 Better Auth 插件端点 /api/auth/sign-in/tenant
      const res = await fetch("/api/auth/sign-in/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug: orgSlug,
          account,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || data.error || "登录失败，请核对企业编码与账号密码");
        setLoading(false);
        return;
      }

      // 验证成功，Better Auth 原生完成 Cookie 种植，直接直通工作台，0 多余弹窗
      router.push("/workbench");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录请求异常，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 font-sans text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* 顶部右侧主题模式切换挂载区 */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <ThemeToggle />
      </header>

      {/* 柔和光晕背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15" />
      </div>

      <Card className="w-full max-w-md border-border/80 bg-card/95 py-6 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/50 text-card-foreground animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-background/80 p-2 shadow-lg shadow-primary/10 backdrop-blur-xs ring-1 ring-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.png"
              alt="系统 Logo"
              className="size-full object-contain"
            />
          </div>
          <CardTitle className="mt-3 text-xl font-black tracking-tight text-foreground">
            企业数智平台登录
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            企业作用域专属独立入口 · 物理隔离与数据安全保障
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive border border-destructive/30 dark:border-destructive/40 dark:bg-destructive/15">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="orgSlug"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <Building2 className="size-3.5 text-muted-foreground" />
                企业编码 (租户标识)
              </label>
              <Input
                id="orgSlug"
                type="text"
                placeholder="例如: demo-corp 或您的企业代号"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
                className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <User className="size-3.5 text-muted-foreground" />
                登录账号
              </label>
              <Input
                id="account"
                type="text"
                placeholder="例如: E0001 / zhangsan"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <KeyRound className="size-3.5 text-muted-foreground" />
                登录密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-xs rounded-xl bg-background/50 border-input placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-60 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  正在认证企业并进入工作台...
                </>
              ) : (
                "登 录 企 业 工 作 台"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
