"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthSplitLayout } from "../components/AuthSplitLayout";
import { GoogleIcon } from "../components/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [picName, setPicName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanBiz = businessName.trim();
    const cleanPic = picName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanBiz || !cleanPic || !cleanPhone || !cleanEmail || !cleanPass) {
      setError("Semua kolom formulir pendaftaran wajib diisi");
      return;
    }

    if (cleanPass.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    const res = await register({
      nama_bisnis: cleanBiz,
      name: cleanPic,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPass,
    });

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.message || "Gagal melakukan pendaftaran akun partner");
    }
  };

  return (
    <AuthSplitLayout
      bannerTitle="Setiap cerita layak dirayakan."
      bannerSubtitle="Daftar sekali, buat invitation kapan saja."
      portalLabel="Portal Partner"
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-3">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
          Mulai bagikan cerita
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Buat akun Partner dengan Google atau isi data
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-2.5 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Lanjutkan dengan Google Button */}
      <Link href="/login/google?role=partner" className="block w-full mb-2">
        <button
          type="button"
          className="w-full bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-semibold text-xs py-2 px-4 rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <GoogleIcon />
          <span>Lanjutkan dengan Google</span>
        </button>
      </Link>

      {/* Divider "atau" */}
      <div className="flex items-center gap-3 my-2">
        <div className="h-[1px] bg-zinc-200 flex-1" />
        <span className="text-zinc-400 text-[11px] font-normal">atau</span>
        <div className="h-[1px] bg-zinc-200 flex-1" />
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Nama Bisnis */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
            Nama bisnis
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Studio Kumtura"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
          />
        </div>

        {/* Row: Nama PIC & Nomor Telepon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
              Nama PIC
            </label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              placeholder="Ben Abednego"
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
              Nomor telepon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812 3456 7890"
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="benabednego@studiokumtura.id"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
          />
        </div>

        {/* Row: Password & Konfirmasi Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 pr-14 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
              >
                {showPassword ? "Tutup" : "Lihat"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
              Konfirmasi password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="........"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 pr-14 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
              >
                {showConfirmPassword ? "Tutup" : "Lihat"}
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox Syarat & Ketentuan */}
        <div className="flex items-center gap-2 pt-0.5">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-zinc-300 text-[#f5a638] focus:ring-[#f5a638] cursor-pointer"
          />
          <label htmlFor="terms" className="text-[11px] text-zinc-600 select-none cursor-pointer">
            Saya setuju dengan syarat dan ketentuan
          </label>
        </div>

        {/* Daftar Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#24140b] hover:bg-black text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 mt-1"
        >
          {isLoading ? "Mendaftarkan..." : "Daftar"}
        </button>
      </form>

      {/* Footer Login Link */}
      <div className="text-center mt-3 text-xs text-zinc-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-bold text-[#d97706] hover:text-[#b45309] hover:underline"
        >
          Masuk
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
