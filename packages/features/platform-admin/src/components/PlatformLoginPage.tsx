"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@chenrun/auth/client";
import { useRouter } from "next/navigation";

/**
 * 平台运营商总管理员登录/注册页面组件 (FDD 自包含切片)
 */
export function PlatformLoginPage(): React.JSX.Element {
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
          setError(res.error.message || "注册失败，请检查输入");
        } else {
          router.push("/overview");
          router.refresh();
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message || "登录失败，邮箱或密码错误");
        } else {
          router.push("/overview");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求发生异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-2xl shadow-lg shadow-purple-500/30">
            ⚡
          </div>
          <h2 className="mt-4 text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            {isRegister ? "注册平台管理员" : "平台运营商总控登录"}
          </h2>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Platform Super Admin 控制中心认证入口
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                姓名 / 备注
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：平台超级管理员"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              超管邮箱地址
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chenrun.com"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              提示：默认平台超管邮箱为 <code>admin@chenrun.com</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              访问密码
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-500 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "正在验证身份..."
              : isRegister
                ? "立即注册超管"
                : "进入总控大盘"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 cursor-pointer"
          >
            {isRegister
              ? "已有平台管理员账号？直接登录"
              : "首次部署？注册初始超级管理员账号"}
          </button>
        </div>
      </div>
    </div>
  );
}
