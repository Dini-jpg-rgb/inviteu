"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, GoogleIcon, EyeIcon } from "../components/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanPassword) {
      setError("Semua kolom formulir pendaftaran wajib diisi");
      return;
    }

    if (cleanName.length < 3) {
      setError("Nama lengkap minimal 3 karakter");
      return;
    }

    // Validasi format email dasar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Format alamat email tidak valid");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    const res = await register({
      nama_bisnis: `${cleanName} Wedding Partner`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword,
    });

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.message || "Gagal melakukan pendaftaran akun partner");
    }
  };

  return (
    <AuthLayout activeRole="partner">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Daftar sebagai partner
        </h1>
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

      {/* Register Form matching Screenshot 2 */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Field: Nama lengkap */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Nama lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dwi Mahardika"
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Field: Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dwimahardika@email.com"
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Field: Nomor telepon */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Nomor telepon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812 3456 7890"
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Field: Password */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
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
        </div>

        {/* Field: Konfirmasi password */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Konfirmasi password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="........"
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm focus:outline-none"
              title={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
            >
              <EyeIcon isOpen={showConfirmPassword} />
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center space-x-2 pt-1 pb-1">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 rounded-xs border-zinc-300 text-amber-500 focus:ring-amber-400 cursor-pointer accent-[#f5a623]"
          />
          <label htmlFor="terms" className="text-xs text-zinc-600 cursor-pointer select-none">
            Setuju dengan syarat dan ketentuan
          </label>
        </div>

        {/* Submit Button ("Daftar") */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f5a623] hover:bg-[#e09214] text-white font-medium py-2.5 sm:py-3 rounded-md text-sm shadow-xs transition-colors disabled:opacity-70 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Mendaftarkan...</span>
            </>
          ) : (
            <span>Daftar</span>
          )}
        </button>

        {/* Divider "atau" */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-zinc-400">atau</span>
          </div>
        </div>

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={() => alert("Fitur Google Register sedang disimulasikan.")}
          className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium py-2 sm:py-2.5 rounded-md text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors shadow-2xs"
        >
          <GoogleIcon />
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Footer Link: Sudah punya akun? Masuk */}
        <div className="text-center pt-2">
          <span className="text-xs text-zinc-500">Sudah punya akun? </span>
          <Link
            href="/login"
            className="text-xs text-[#2f80ed] font-medium hover:underline"
          >
            Masuk
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
