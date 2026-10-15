"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, GoogleIcon, EyeIcon } from "../../components/AuthLayout";

function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

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
      setError("Email dan password wajib diisi");
      return;
    }

    // Login khusus peran Partner (Isolasi Ketat Role)
    const res = await login(cleanEmail, cleanPassword, true, "partner");

    if (res.success) {
      router.push(callbackUrl || "/dashboard");
    } else {
      setError(res.message || "Gagal masuk. Periksa kembali email dan password Anda.");
    }
  };

  return (
    <AuthLayout activeRole="partner">
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Masuk ke InviteU
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5">
          Kelola dan bagikan undangan klienmu
        </p>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Login Form */}
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
            placeholder="dwimahardika@email.com"
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

          {/* Lupa Password Link */}
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
          className="w-full bg-[#f5a623] hover:bg-[#e09214] text-white font-medium py-2.5 sm:py-3 rounded-md text-sm shadow-xs transition-colors disabled:opacity-70 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Masuk</span>
          )}
        </button>

        {/* Divider "atau" */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-zinc-400">atau</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => alert("Fitur Google Sign-In sedang disimulasikan.")}
          className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium py-2.5 sm:py-2.5 rounded-md text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors shadow-2xs"
        >
          <GoogleIcon />
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Footer Link: Belum punya akun? Daftar */}
        <div className="text-center pt-2">
          <span className="text-xs text-zinc-500">Belum punya akun? </span>
          <Link
            href="/register"
            className="text-xs text-[#2f80ed] font-medium hover:underline"
          >
            Daftar
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fdfaf4]">
          <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PartnerLoginForm />
    </Suspense>
  );
}
