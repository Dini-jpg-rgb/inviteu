"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "../components/AuthSplitLayout";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Silakan masukkan alamat email akun Anda");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    // Navigasi ke halaman Reset Password sesuai alur
    router.push(`/reset-password?email=${encodeURIComponent(cleanEmail)}`);
  };

  return (
    <AuthSplitLayout
      bannerTitle="Tenang, akunmu aman."
      bannerSubtitle="Kami bantu kamu masuk kembali."
      portalLabel="Portal Partner"
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-4">
        <h1 className="font-serif text-2xl sm:text-[26px] font-bold text-zinc-900 tracking-tight leading-tight">
          Lupa password
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          Masukkan email, kami kirim tautan reset
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="benabednego@email.com"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
          />
        </div>

        {/* Lanjut Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#24140b] hover:bg-black text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 mt-1"
        >
          {isLoading ? "Mengirim tautan..." : "Lanjut"}
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
