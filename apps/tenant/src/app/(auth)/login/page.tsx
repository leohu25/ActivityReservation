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
} from "@base/ui";
import { Loader2, Building2, KeyRound, User } from "lucide-react";

/**
 * 租户专属工业级三要素登录界面 (企业编码 + 账号/手机号 + 密码)
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
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 dark:bg-slate-950 font-sans">
      <Card className="w-full max-w-md border-slate-200/80 bg-white py-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-lg shadow-md shadow-blue-500/25 ring-1 ring-blue-500/20">
            CR
          </div>
          <CardTitle className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            宸润数智 ERP 租户登录
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            企业作用域专属独立入口 · 物理隔离与数据安全保障
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="orgSlug"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <Building2 className="size-3.5 text-slate-400" />
                企业编码 (租户标识)
              </label>
              <Input
                id="orgSlug"
                type="text"
                placeholder="例如: cr-corp 或您的企业代号"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
                className="h-10 text-sm rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <User className="size-3.5 text-slate-400" />
                登录账号
              </label>
              <Input
                id="account"
                type="text"
                placeholder="例如: E0001 / zhangsan"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                className="h-10 text-sm rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <KeyRound className="size-3.5 text-slate-400" />
                登录密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-sm rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60 transition-all"
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
