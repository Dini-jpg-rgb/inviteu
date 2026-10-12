"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi");
      return;
    }

    const res = await login(email, password, remember);
    if (res.success) {
      router.push(callbackUrl);
    } else {
      setError(res.message || "Gagal masuk, periksa kembali data Anda");
    }
  };

  const fillDemoCredentials = () => {
    setEmail("partner@inviteu.id");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-10">
      {/* Brand & Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-bold text-xl mb-4 shadow-md">
          IU
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Masuk ke Portal Partner
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Kelola undangan digital klien Anda dengan mudah melalui <b>InviteU</b>
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Bisnis"
          type="email"
          placeholder="nama@vendoranda.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-medium"
            >
              {showPassword ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Ingat sesi saya
            </span>
          </label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold shadow-md"
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
        </Button>
      </form>

      {/* Quick Demo Helper */}
      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          Ingin mencoba langsung tanpa backend?
        </p>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition"
        >
          ✨ Klik untuk isi Kredensial Demo Partner
        </button>
      </div>

      {/* Register CTA */}
      <div className="mt-6 text-center text-xs text-zinc-600 dark:text-zinc-400">
        Belum terdaftar sebagai Partner?{" "}
        <Link
          href="/register"
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Suspense fallback={<div className="text-sm text-zinc-500">Memuat formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
