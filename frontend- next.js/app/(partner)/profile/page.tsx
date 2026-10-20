"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, partner } = useAuth();

  const [namaBisnis, setNamaBisnis] = useState(partner?.nama_bisnis || "Artha Wedding & Event");
  const [picName, setPicName] = useState(user?.name || "Budi Santoso");
  const [email] = useState(user?.email || "partner@inviteu.id");
  const [phone, setPhone] = useState(partner?.phone || "081234567890");
  const [address, setAddress] = useState(partner?.address || "Jl. Sudirman No. 45, Jakarta Selatan");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profil Bisnis Partner
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola informasi identitas vendor dan kontak resmi Anda di InviteU.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Perubahan profil bisnis berhasil disimpan!</span>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xl shadow">
              {namaBisnis.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {namaBisnis}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                ● Partner Aktif
              </span>
            </div>
          </div>

          <Input
            label="Nama Bisnis / Vendor"
            value={namaBisnis}
            onChange={(e) => setNamaBisnis(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Penanggung Jawab (PIC)"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              required
            />
            <Input
              label="Nomor WhatsApp Resmi"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Bisnis (Akun Login)"
            type="email"
            value={email}
            disabled
            className="bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
              Alamat Kantor / Studio
            </label>
            <textarea
              rows={3}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="md" className="font-semibold px-6">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
