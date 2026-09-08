"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 登录与注册独立路由页面
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-500/20">
            CR
          </div>
          <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isRegister ? "注册新账号" : "SaaS 租户用户登录"}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            晨润 ERP 统一身份与组织访问入口
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                用户姓名 / 昵称
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：张三"
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              邮箱地址
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 block w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              账户密码
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-500 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50 transition-colors"
          >
            {loading ? "提交处理中..." : isRegister ? "立即注册" : "安全登录"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-blue-600 hover:underline dark:text-blue-400 font-semibold"
          >
            {isRegister ? "已有账号？点此登录" : "没有账号？点此快速注册"}
          </button>

          <Link href="/" className="hover:underline text-zinc-400">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
