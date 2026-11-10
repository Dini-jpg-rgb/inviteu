"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useUserManagement } from "@/context/UserManagementContext";

export default function PartnerProfilePage() {
  const { getPartnerStatus } = useUserManagement();

  // Mode: View (default) vs Edit
  const [isEditing, setIsEditing] = useState(false);

  // Profile States with localStorage persistence
  const [name, setName] = useState("Undiksha Team");
  const gmailAccount = "undikshateam@gmail.com"; // Official login identity
  const currentStatus = getPartnerStatus("undikshateam@gmail.com");
  const isAccountActive = currentStatus === "active";
  const [phone, setPhone] = useState("0812 3456 7890");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Sync profile from localStorage on client-side (prevents SSR hydration mismatch)
  React.useEffect(() => {
    try {
      const savedName = localStorage.getItem("inviteu_partner_name");
      if (savedName) setName(savedName);
      const savedPhone = localStorage.getItem("inviteu_partner_phone");
      if (savedPhone) setPhone(savedPhone);
      const savedPhoto = localStorage.getItem("inviteu_partner_photo");
      if (savedPhoto) setPhotoUrl(savedPhoto);
    } catch {
      // ignore
    }
  }, []);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoUrl(base64);
        try {
          localStorage.setItem("inviteu_partner_photo", base64);
          window.dispatchEvent(new Event("inviteu_profile_updated"));
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    try {
      localStorage.removeItem("inviteu_partner_photo");
      window.dispatchEvent(new Event("inviteu_profile_updated"));
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("inviteu_partner_name", name.trim() || "Undiksha Team");
      localStorage.setItem("inviteu_partner_phone", phone.trim() || "0812 3456 7890");
      if (photoUrl) {
        localStorage.setItem("inviteu_partner_photo", photoUrl);
      } else {
        localStorage.removeItem("inviteu_partner_photo");
      }
      window.dispatchEvent(new Event("inviteu_profile_updated"));
    } catch {
      // ignore
    }
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* 1. Page Header (Kembali di pojok atas konten seperti semula: Profile & Data akun Partner) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
          Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Data akun Partner
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-semibold">
              Perubahan profil berhasil disimpan!
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Tersimpan</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TAMPILAN VIEW MODE (Sebelum Diedit - Sesuai Gambar 1 & Ditengah) */}
      {/* ============================================================== */}
      {!isEditing ? (
        <div className="space-y-5">
          {/* Centered Card Data Partner */}
          <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs space-y-6">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">
              Data Partner
            </h2>

            {/* Avatar Preview (Diletakkan di Tengah) */}
            <div className="flex justify-center py-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-100 border-2 border-[#e5d8c8] flex items-center justify-center shadow-xs">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt="Foto Profil"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 text-zinc-400">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* List Rows Data Partner (Alamat & Nama PIC Dihapus, Nama bisnis diganti jadi Nama) */}
            <div className="divide-y divide-zinc-100 text-xs">
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-zinc-500 font-medium">Nama</span>
                <span className="font-bold text-zinc-900 text-right">{name}</span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-zinc-500 font-medium">Email</span>
                <span className="font-medium text-zinc-800 text-right">{gmailAccount}</span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-zinc-500 font-medium">Nomor telepon</span>
                <span className="font-medium text-zinc-800 text-right">{phone}</span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-zinc-500 font-medium">Status akun</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#eaf7f0] text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Aktif</span>
                </span>
              </div>
            </div>

            {/* Edit Profil Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Edit profil
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. TAMPILAN EDIT MODE (Sesuai Gambar 2: Nama & Foto Bisa Diedit, */
        /*    Tanpa Emot Gembok, Selaras Tema Utama)                      */
        /* ============================================================== */
        <div className="space-y-5">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                  Informasi Akun Partner
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                  Perbarui nama, nomor kontak, dan foto profil partner
                </p>
              </div>

              {/* Account Status Badge (Clean, No AI Emojis) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Status Akun:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isAccountActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAccountActive ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span>{isAccountActive ? "Aktif" : "Nonaktif / Dibekukan"}</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar / Foto Profil Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-100 border-2 border-[#e5d8c8] flex items-center justify-center shrink-0 shadow-xs">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Foto Profil"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 text-zinc-400">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800">
                      Foto Profil
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-[#fef5e7] px-2 py-0.5 rounded border border-[#fae2c0]">
                      Dapat Diedit
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Format yang didukung: JPG, PNG, WEBP (Maksimal 2 MB).
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ubah Foto
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="bg-white hover:bg-zinc-50 border border-zinc-200 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-4" />

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Field 1: Nama (DAPAT DIEDIT - Tanpa Emot Gembok) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">
                      Nama <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-[#fef5e7] px-2 py-0.5 rounded border border-[#fae2c0]">
                      Dapat Diedit
                    </span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama partner / bisnis"
                    className="w-full text-xs font-medium bg-white border border-zinc-300 focus:border-[#f5a638] focus:ring-1 focus:ring-[#f5a638] text-zinc-900 rounded-xl p-3 shadow-2xs outline-none transition-all"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">
                    Nama partner yang ditampilkan pada sistem dan profil.
                  </p>
                </div>

                {/* Field 2: Gmail / Email Akun (Read-only - Tanpa Emot Gembok) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">
                      Gmail / Email Akun
                    </label>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Identitas Akun
                    </span>
                  </div>
                  <input
                    type="text"
                    value={gmailAccount}
                    readOnly
                    disabled
                    className="w-full text-xs font-medium bg-[#faf6f0] border border-[#e5d8c8] text-zinc-700 rounded-xl p-3 cursor-not-allowed select-none shadow-2xs"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Email Gmail terhubung sebagai identitas login resmi.
                  </p>
                </div>

                {/* Field 3: Status Kemitraan (Tanpa Emot Gembok) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">
                      Status Kemitraan
                    </label>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Sistem
                    </span>
                  </div>
                  <div className="w-full text-xs font-medium bg-[#faf6f0] border border-[#e5d8c8] rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAccountActive ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span className="font-semibold text-zinc-800">
                        {isAccountActive
                          ? "Aktif (Terverifikasi Sistem)"
                          : "Dibekukan / Nonaktif"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isAccountActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isAccountActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Akun kemitraan aktif dan dapat mempublikasikan undangan.
                  </p>
                </div>

                {/* Field 4: Nomor Telepon (Dapat Diedit) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">
                      Nomor Telepon <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-[#fef5e7] px-2 py-0.5 rounded border border-[#fae2c0]">
                      Dapat Diedit
                    </span>
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812 3456 7890"
                    className="w-full text-xs font-medium bg-white border border-zinc-300 focus:border-[#f5a638] focus:ring-1 focus:ring-[#f5a638] text-zinc-900 rounded-xl p-3 shadow-2xs outline-none transition-all"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">
                    Digunakan untuk notifikasi WhatsApp rincian pesanan & RSVP tamu.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Batal & Simpan Perubahan Profil */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#f5a638] hover:bg-[#e09228] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
