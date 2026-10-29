"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePartner } from "@/context/PartnerContext";
import { useUserManagement } from "@/context/UserManagementContext";

export default function PartnerProfilePage() {
  const { transactions } = usePartner();
  const { getPartnerStatus } = useUserManagement();

  // 1. Profile State
  const fullName = "Undiksha Team"; // Read-only as instructed
  const gmailAccount = "undikshateam@gmail.com"; // Read-only as instructed
  const currentStatus = getPartnerStatus("undikshateam@gmail.com");
  const isAccountActive = currentStatus === "active";

  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return "0812 3456 7890";
    try {
      return localStorage.getItem("inviteu_partner_phone") || "0812 3456 7890";
    } catch {
      return "0812 3456 7890";
    }
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("inviteu_partner_photo") || null;
    } catch {
      return null;
    }
  });

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
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("inviteu_partner_phone", phone.trim());
      if (photoUrl) {
        localStorage.setItem("inviteu_partner_photo", photoUrl);
      }
    } catch {
      // ignore
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // 3. Invoice & Payment History Data (Integrated from previous invoice menu)
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");

  const baseInvoices = [
    {
      id: "INV-2026-10-041",
      date: "14 Okt 2026",
      packageName: "Package Pro (200 Kuota Undangan)",
      amount: "Rp 3.000.000",
      paymentMethod: "BCA Virtual Account",
      status: "paid" as const,
    },
    {
      id: "INV-2026-09-028",
      date: "14 Sep 2026",
      packageName: "Package Basic (50 Kuota Undangan)",
      amount: "Rp 1.500.000",
      paymentMethod: "QRIS / GoPay",
      status: "paid" as const,
    },
    {
      id: "INV-2026-10-099",
      date: "18 Okt 2026",
      packageName: "Package Premium (500 Kuota Undangan)",
      amount: "Rp 5.500.000",
      paymentMethod: "Mandiri Virtual Account",
      status: "unpaid" as const,
    },
  ];

  // Merge with any dynamic package transactions from usePartner()
  const dynamicInvoices = transactions.map((tx) => ({
    id: tx.orderNumber,
    date: tx.date,
    packageName: `Package ${tx.packageName}`,
    amount: tx.amount,
    paymentMethod: "Simulasi B2B",
    status: tx.status === "Paid" ? ("paid" as const) : ("unpaid" as const),
  }));

  const allInvoices = [...dynamicInvoices, ...baseInvoices];

  const filteredInvoices = allInvoices.filter((inv) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  const paidCount = allInvoices.filter((i) => i.status === "paid").length;
  const unpaidCount = allInvoices.filter((i) => i.status === "unpaid").length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Page Header */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Profil Partner
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Kelola informasi identitas akun, nomor kontak, serta riwayat invoice & pembayaran kemitraan Anda
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">
              Perubahan profil (nomor telepon & foto) berhasil disimpan!
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Tersimpan</span>
        </div>
      )}

      {/* 2. Kartu Informasi Profil Partner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">
              Informasi Akun Partner
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Informasi resmi partner terdaftar di platform InviteU
            </p>
          </div>

          {/* Account Status Badge */}
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
                className={`w-1.5 h-1.5 rounded-full ${
                  isAccountActive ? "bg-emerald-600 animate-pulse" : "bg-rose-600"
                }`}
              />
              <span className="capitalize">{isAccountActive ? "Aktif" : "Inaktif"}</span>
            </span>
          </div>
        </div>

        {/* Warning banner if account is inactive */}
        {!isAccountActive && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Status Akun Anda Saat Ini: Inaktif</p>
              <p className="mt-0.5 text-rose-700 text-[11px]">
                Akun kemitraan ini telah dinonaktifkan oleh Superadmin melalui User Management. Fitur publikasi undangan baru sementara dibatasi. Silakan hubungi admin untuk aktivasi kembali.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Foto Profil Section (Editable) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-100 border-2 border-[#e5d8c8] overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Foto Profil Partner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-800">Foto Profil</span>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  Dapat Diedit
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Format yang didukung: JPG, PNG, WEBP (Maksimal 2 MB).
              </p>

              <div className="flex items-center gap-2 pt-0.5">
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
                  className="bg-[#331c11] hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Ubah Foto
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Field: Nama Lengkap (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                  <span>Nama Lengkap</span>
                  <span className="text-zinc-400">🔒</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">Tetap (Terkunci)</span>
              </div>
              <input
                type="text"
                value={fullName}
                disabled
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3.5 py-2.5 text-xs text-zinc-600 font-medium cursor-not-allowed shadow-2xs"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Nama partner terverifikasi pada kontrak kemitraan.
              </p>
            </div>

            {/* Field: Gmail / Email (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                  <span>Gmail / Email Akun</span>
                  <span className="text-zinc-400">🔒</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">Tetap (Terkunci)</span>
              </div>
              <input
                type="email"
                value={gmailAccount}
                disabled
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3.5 py-2.5 text-xs text-zinc-600 font-medium cursor-not-allowed shadow-2xs"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Email Gmail terhubung sebagai identitas login resmi.
              </p>
            </div>

            {/* Field: Status Kemitraan (Dynamic, controlled by Admin) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                  <span>Status Kemitraan</span>
                  <span className="text-zinc-400">🔒</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">Dikelola Admin</span>
              </div>
              <div
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium flex items-center justify-between cursor-not-allowed shadow-2xs ${
                  isAccountActive
                    ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                    : "border-rose-200 bg-rose-50/50 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAccountActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span>
                    {isAccountActive
                      ? "Aktif (Terverifikasi Sistem)"
                      : "Inaktif (Dinonaktifkan oleh Admin)"}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                    isAccountActive
                      ? "text-emerald-700 bg-emerald-100 border border-emerald-300"
                      : "text-rose-700 bg-rose-100 border border-rose-300"
                  }`}
                >
                  {isAccountActive ? "Aktif" : "Inaktif"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                {isAccountActive
                  ? "Akun kemitraan aktif dan dapat mempublikasikan undangan."
                  : "Akun sedang ditangguhkan atau dinonaktifkan oleh Administrator."}
              </p>
            </div>

            {/* Field: Nomor Telepon (EDITABLE) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                  <span>Nomor Telepon</span>
                  <span className="text-amber-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  Dapat Diedit
                </span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812 3456 7890"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Digunakan untuk notifikasi WhatsApp rincian pesanan & RSVP tamu.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="bg-[#f5a638] hover:bg-[#e09228] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simpan Perubahan Profil
            </button>
          </div>
        </form>
      </div>

      {/* 3. Kartu: Invoice & Riwayat Pembayaran (Dipindahkan ke sini sesuai instruksi) */}
      <div id="invoice" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">
              Invoice & Riwayat Pembayaran
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Daftar seluruh tagihan kuota paket dan riwayat transaksi kemitraan Anda
            </p>
          </div>

          <Link href="/packages">
            <button className="bg-[#331c11] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer">
              + Beli Paket Baru
            </button>
          </Link>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#fcfaf7] border border-[#eee4d7] rounded-xl p-4">
            <span className="text-[11px] text-zinc-500 font-medium">Total Transaksi</span>
            <div className="text-lg font-bold text-zinc-900 mt-1">{allInvoices.length} Transaksi</div>
          </div>
          <div className="bg-[#f0fbf5] border border-[#d2f3e1] rounded-xl p-4">
            <span className="text-[11px] text-emerald-700 font-medium">Lunas (Paid)</span>
            <div className="text-lg font-bold text-emerald-800 mt-1">{paidCount} Transaksi</div>
          </div>
          <div className="bg-[#fef9f0] border border-[#fde8c5] rounded-xl p-4">
            <span className="text-[11px] text-amber-700 font-medium">Menunggu Pembayaran</span>
            <div className="text-lg font-bold text-amber-800 mt-1">{unpaidCount} Transaksi</div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === "all"
                ? "bg-[#331c11] text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Semua ({allInvoices.length})
          </button>
          <button
            onClick={() => setFilterStatus("paid")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === "paid"
                ? "bg-[#331c11] text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Lunas ({paidCount})
          </button>
          <button
            onClick={() => setFilterStatus("unpaid")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === "unpaid"
                ? "bg-[#331c11] text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Menunggu ({unpaidCount})
          </button>
        </div>

        {/* Invoice Table */}
        <div className="rounded-xl overflow-hidden border border-[#e5d8c8] shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#331c11] text-white">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nomor Invoice</th>
                  <th className="py-3 px-4 font-semibold">Paket Kuota</th>
                  <th className="py-3 px-4 font-semibold">Nominal</th>
                  <th className="py-3 px-4 font-semibold">Metode Pembayaran</th>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-400">
                      Tidak ada data invoice ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-800">
                        {inv.packageName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900">
                        {inv.amount}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {inv.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {inv.date}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === "paid" ? (
                          <span className="inline-block bg-[#eaf7f0] text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-block bg-[#fef5e7] text-amber-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-amber-200">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => alert(`Rincian Invoice: ${inv.id}\nPaket: ${inv.packageName}\nNominal: ${inv.amount}\nMetode: ${inv.paymentMethod}\nStatus: ${inv.status.toUpperCase()}`)}
                          className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-semibold px-3 py-1 rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
