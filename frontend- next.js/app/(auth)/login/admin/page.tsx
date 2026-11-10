"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthSplitLayout } from "../../components/AuthSplitLayout";
import { GoogleIcon } from "../../components/AuthLayout";

function AdminLoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Email dan password admin wajib diisi");
      return;
    }

    const res = await login(cleanEmail, cleanPassword, true, "admin");

    if (res.success && res.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      setError(
        res.message || "Akses admin ditolak. Pastikan email dan password terdaftar benar."
      );
    }
  };

  return (
    <AuthSplitLayout
      bannerTitle="Pusat Kendali Platform."
      bannerSubtitle="Kelola seluruh operasional ekosistem InviteU."
      portalLabel="Portal Admin"
      currentRole="admin"
      showRoleSwitcher={true}
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-3">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
          Masuk ke Admin
        </h1>
        <p className="text-[11px] text-zinc-500 font-normal mt-0.5">
          Panel kontrol & administrasi sistem InviteU
        </p>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mb-2.5 p-2 px-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 shadow-2xs">
          <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 leading-snug">
            <span>{error}</span>
            {error.includes("Designer") && (
              <Link
                href="/login/designer"
                className="block mt-1 font-bold text-red-900 hover:text-black underline"
              >
                → Buka Halaman Login Designer Sekarang
              </Link>
            )}
            {error.includes("Partner") && (
              <Link
                href="/login"
                className="block mt-1 font-bold text-red-900 hover:text-black underline"
              >
                → Buka Halaman Login Partner Sekarang
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
            Email Admin
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 pr-16 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              {showPassword ? "Tutup" : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* Masuk Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#24140b] hover:bg-black text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 mt-1"
        >
          {isLoading ? "Memverifikasi..." : "Masuk"}
        </button>

        {/* Divider "atau" */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-[1px] bg-zinc-200 flex-1" />
          <span className="text-zinc-400 text-[10px] font-normal">atau</span>
          <div className="h-[1px] bg-zinc-200 flex-1" />
        </div>

        {/* Masuk dengan Google Button (Admin role) */}
        <Link href="/login/google?role=admin" className="block w-full">
          <button
            type="button"
            className="w-full bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-semibold text-xs py-1.5 px-4 rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <GoogleIcon />
            <span>Masuk dengan Google</span>
          </button>
        </Link>
      </form>
    </AuthSplitLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
