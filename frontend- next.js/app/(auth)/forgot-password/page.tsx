"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Silakan masukkan email bisnis Anda");
      return;
    }

    setIsLoading(true);
    // Simulasi pengiriman reset password
    await new Promise((r) => setTimeout(r, 700));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-bold text-xl mb-4 shadow-md">
            IU
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Masukkan email bisnis yang terdaftar untuk menerima tautan pemulihan
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              <p className="font-semibold mb-1">Tautan Pemulihan Terkirim!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Kami telah mengirimkan instruksi ke email <b>{email}</b>. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsSubmitted(false)}
            >
              Kirim Ulang ke Email Lain
            </Button>

            <div>
              <Link
                href="/login"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                ← Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Email Bisnis Terdaftar"
              type="email"
              placeholder="nama@vendoranda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Mengirim Tautan..." : "Kirim Tautan Pemulihan"}
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/login"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Sudah ingat kata sandi? <b>Masuk</b>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
