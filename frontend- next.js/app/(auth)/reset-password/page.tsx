"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "../components/AuthSplitLayout";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || !cleanConfirm) {
      setError("Silakan isi password baru dan konfirmasi password");
      return;
    }

    if (cleanPass.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    setSuccess(true);

    setTimeout(() => {
      router.push("/login");
    }, 1800);
  };

  return (
    <AuthSplitLayout
      bannerTitle="Hampir selesai."
      bannerSubtitle="Buat password baru dan masuk kembali."
      portalLabel="Portal Partner"
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-4">
        <h1 className="font-serif text-2xl sm:text-[26px] font-bold text-zinc-900 tracking-tight leading-tight">
          Reset password
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          Buat password baru untuk akunmu
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold">
            Password berhasil diubah! Mengalihkan ke halaman login...
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Password Baru */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Password baru
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 pr-20 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              {showPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Konfirmasi password baru
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 pr-20 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              {showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* Password Hint */}
        <p className="text-[11px] text-zinc-500 font-normal">
          Gunakan password yang sulit ditebak.
        </p>

        {/* Reset Password Button */}
        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full bg-[#24140b] hover:bg-black text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 mt-1"
        >
          {isLoading ? "Menyimpan..." : "Reset password"}
        </button>
      </form>

      {/* Footer Return to Login */}
      <div className="text-center mt-5 text-xs text-zinc-500">
        Kembali ke{" "}
        <Link
          href="/login"
          className="font-bold text-[#d97706] hover:text-[#b45309] hover:underline"
        >
          Login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
