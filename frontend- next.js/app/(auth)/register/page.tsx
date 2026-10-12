"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [namaBisnis, setNamaBisnis] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!namaBisnis || !name || !email || !password) {
      setError("Semua kolom bertanda bintang (*) wajib diisi");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui syarat & ketentuan kemitraan");
      return;
    }

    const res = await register({
      nama_bisnis: namaBisnis,
      name,
      email,
      phone,
      password,
    });

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.message || "Gagal melakukan pendaftaran");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-10">
        {/* Brand & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-bold text-xl mb-4 shadow-md">
            IU
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Daftar Kemitraan InviteU
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Gabung sebagai Partner/Vendor dan mulai sediakan undangan digital untuk klien Anda
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Bisnis / Vendor *"
            placeholder="Contoh: Mahadewi Wedding Organizer"
            value={namaBisnis}
            onChange={(e) => setNamaBisnis(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap PIC *"
              placeholder="Nama penanggung jawab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Nomor WhatsApp *"
              type="tel"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Bisnis *"
            type="email"
            placeholder="kontak@vendoranda.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kata Sandi *"
              type="password"
              placeholder="Min. 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Input
              label="Ulangi Kata Sandi *"
              type="password"
              placeholder="Konfirmasi sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Saya menyetujui Syarat & Ketentuan Kemitraan serta Kebijakan Privasi B2B InviteU.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-semibold shadow-md mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Mendaftarkan Akun..." : "Daftar sebagai Partner"}
          </Button>
        </form>

        {/* Login CTA */}
        <div className="mt-8 text-center text-xs text-zinc-600 dark:text-zinc-400 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          Sudah memiliki akun Partner?{" "}
          <Link
            href="/login"
            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
