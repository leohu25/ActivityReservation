"use client";

import React, { useState } from "react";
import { signIn, signUp, authClient } from "@chenrun/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
} from "@chenrun/ui";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

/**
 * 登录与注册独立路由页面 (遵循现代轻量数智风与 shadcn/ui)
 */
export default function LoginPage() {
  const router = useRouter();
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

    try {
      if (isRegister) {
        const res = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) {
          setError(res.error.message || "注册失败，请检查填写内容");
        } else {
          router.push("/workbench");
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message || "登录失败，账号或密码错误");
        } else {
          // 登录成功后，主动拉取用户的租户列表并自动激活租户上下文
          try {
            const orgsRes = await authClient.organization.list();
            const orgList = orgsRes.data || [];
            if (orgList.length === 1 && orgList[0]?.id) {
              // 唯一定点租户：静默无感自动激活
              await authClient.organization.setActive({
                organizationId: orgList[0].id,
              });
            } else if (orgList.length > 1) {
              // 多租户：默认激活首个租户保障页面立即可用
              const firstOrg = orgList[0];
              if (firstOrg?.id) {
                await authClient.organization.setActive({
                  organizationId: firstOrg.id,
                });
              }
            }
          } catch {
            // 忽略非阻塞的组织查询异常
          }
          router.push("/workbench");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 dark:bg-slate-950 font-sans">
      <Card className="w-full max-w-md border-slate-200/80 bg-white p-2 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-lg shadow-md shadow-blue-500/25 ring-1 ring-blue-500/20">
            CR
          </div>
          <CardTitle className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {isRegister ? "注册企业新账号" : "宸润数智 ERP 租户登录"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            全链路数字化供应链与精益制造统一入口
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  用户姓名 / 称谓
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：王建国"
                  className="rounded-lg"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                企业工作邮箱
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@chenrun.com"
                className="rounded-lg font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                账户登录密码
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg font-bold shadow-md shadow-blue-600/20"
            >
              {loading && <Loader2 className="size-4 animate-spin mr-1" />}
              <span>
                {loading
                  ? "验证安全凭据..."
                  : isRegister
                    ? "立即完成注册"
                    : "安全登录系统"}
              </span>
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
            >
              {isRegister ? "已有企业账号？点此登录" : "没有账号？点此快速注册"}
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <ArrowLeft className="size-3" />
              <span>返回主页</span>
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span>Database-per-Tenant 物理数据库独立加密隔离</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
