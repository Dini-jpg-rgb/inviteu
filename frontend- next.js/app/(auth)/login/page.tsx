"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type UserRole = "partner" | "designer" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const { login, isLoading } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>("partner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ganti tab role
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi");
      return;
    }

    const res = await login(email, password, remember, activeRole);
    if (res.success) {
      if (res.role === "admin") {
        router.push("/admin/dashboard");
      } else if (res.role === "designer") {
        router.push("/designer/dashboard");
      } else {
        router.push(callbackUrl || "/dashboard");
      }
    } else {
      setError(res.message || "Gagal masuk, periksa kembali data Anda");
    }
  };

  // Tombol instan isi kredensial demo sesuai role yang aktif
  const fillDemoCredentials = () => {
    if (activeRole === "admin") {
      setEmail("admin@inviteu.id");
      setPassword("password123");
    } else if (activeRole === "designer") {
      setEmail("designer@inviteu.id");
      setPassword("password123");
    } else {
      setEmail("partner@inviteu.id");
      setPassword("password123");
    }
    setError(null);
  };

  const roleConfig = {
    partner: {
      badge: "B2B Partner",
      title: "Masuk ke Portal Partner",
      desc: "Kelola kuota, pesanan, dan proyek undangan digital bisnis Anda.",
      themeColor: "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900",
      demoLabel: "✨ Isi Demo Partner (partner@inviteu.id)",
      buttonLabel: "Masuk ke Partner Dashboard",
    },
    designer: {
      badge: "Creative Lead",
      title: "Workspace Desainer",
      desc: "Ruang kerja pembuatan dan pengelolaan template undangan digital.",
      themeColor: "bg-indigo-600 text-white",
      demoLabel: "✨ Isi Demo Desainer (designer@inviteu.id)",
      buttonLabel: "Masuk ke Workspace Desainer",
    },
    admin: {
      badge: "Superadmin",
      title: "Panel Kontrol Admin",
      desc: "Pengawasan operasional platform, persetujuan template, dan laporan.",
      themeColor: "bg-rose-600 text-white",
      demoLabel: "✨ Isi Demo Admin (admin@inviteu.id)",
      buttonLabel: "Masuk ke Admin Panel",
    },
  };

  const current = roleConfig[activeRole];

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-10">
      {/* 1. Pemilih Peran / Role Selector Tabs */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 text-center">
          Pilih Peran Masuk (PRD v3.0)
        </p>
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleRoleChange("partner")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeRole === "partner"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Partner
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("designer")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeRole === "designer"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Desainer
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeRole === "admin"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* 2. Brand & Header Dinamis */}
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-xl mb-3 shadow-md transition-colors ${current.themeColor}`}
        >
          IU
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {current.title}
          </h1>
          <Badge
            variant={
              activeRole === "admin"
                ? "destructive"
                : activeRole === "designer"
                ? "info"
                : "default"
            }
          >
            {current.badge}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {current.desc}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* 3. Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={
            activeRole === "admin"
              ? "Email Staf Internal"
              : activeRole === "designer"
              ? "Email Desainer"
              : "Email Bisnis Vendor"
          }
          type="email"
          placeholder={
            activeRole === "admin"
              ? "admin@inviteu.id"
              : activeRole === "designer"
              ? "designer@inviteu.id"
              : "nama@vendoranda.com"
          }
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
            {activeRole === "partner" && (
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
              >
                Lupa kata sandi?
              </Link>
            )}
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
          className={`w-full font-semibold shadow-md transition-colors ${
            activeRole === "admin"
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : activeRole === "designer"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : current.buttonLabel}
        </Button>
      </form>

      {/* 4. Quick Demo Autofill Button */}
      <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
          Uji coba cepat tanpa server backend:
        </p>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition"
        >
          {current.demoLabel}
        </button>
      </div>

      {/* 5. Catatan Registrasi Sesuai PRD v3.0 Bagian 25 */}
      <div className="mt-5 text-center text-xs text-zinc-600 dark:text-zinc-400">
        {activeRole === "partner" ? (
          <div>
            Belum terdaftar sebagai Partner?{" "}
            <Link
              href="/register"
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Daftar Sekarang
            </Link>
          </div>
        ) : activeRole === "designer" ? (
          <div className="rounded-lg bg-indigo-50/60 p-2 text-[11px] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            ℹ️ Akun Desainer bersifat internal dan dibuat oleh administrator InviteU (Tidak ada registrasi mandiri).
          </div>
        ) : (
          <div className="rounded-lg bg-rose-50/60 p-2 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            ℹ️ Akses terbatas khusus staf dan administrator sistem InviteU (Tidak ada registrasi mandiri).
          </div>
        )}
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
