"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, EyeIcon } from "../../components/AuthLayout";

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
    <AuthLayout activeRole="admin">
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Masuk ke InviteU
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5">
          Panel kontrol & administrasi sistem InviteU
        </p>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Admin Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm focus:outline-none"
              title={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              <EyeIcon isOpen={showPassword} />
            </button>
          </div>

          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs text-[#2f80ed] hover:underline font-normal"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        {/* Submit Button ("Masuk") */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f5a623] hover:bg-[#e09214] text-white font-medium py-2.5 sm:py-3 rounded-md text-sm shadow-xs transition-colors disabled:opacity-70 flex items-center justify-center space-x-2 mt-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memverifikasi Admin...</span>
            </>
          ) : (
            <span>Masuk</span>
          )}
        </button>

        {/* Note: Tidak ada pendaftaran akun dan tidak ada tombol Google sesuai spesifikasi */}
      </form>
    </AuthLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fdfaf4]">
          <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
