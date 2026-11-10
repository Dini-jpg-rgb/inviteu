"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePartner } from "@/context/PartnerContext";

export default function PartnerInvoicePage() {
  const { invoices } = usePartner();
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const cancelledCount = invoices.filter((i) => i.status === "cancelled").length;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Filter status
      if (filterStatus === "paid" && inv.status !== "paid") return false;
      if (filterStatus === "unpaid" && inv.status !== "unpaid") return false;
      if (filterStatus === "cancelled" && inv.status !== "cancelled") return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = inv.id.toLowerCase().includes(q);
        const matchPkg = inv.packageName.toLowerCase().includes(q);
        const matchMethod = inv.paymentMethod.toLowerCase().includes(q);
        const matchDate = inv.date.toLowerCase().includes(q);
        const matchAmount = inv.amount.toLowerCase().includes(q);
        if (!matchId && !matchPkg && !matchMethod && !matchDate && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, filterStatus, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* 1. Page Header (Judul & Tombol Beli Paket Baru) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            Invoice & Riwayat Pembayaran
          </h1>
          <p className="text-xs text-zinc-500 font-normal mt-1">
            Daftar seluruh tagihan kuota paket dan riwayat transaksi kemitraan Anda
          </p>
        </div>

        <Link href="/packages">
          <button
            type="button"
            className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Beli Paket Baru</span>
          </button>
        </Link>
      </div>

      {/* 2. Top Metric Statistic Cards (4 Kotak Status Oranye - Warna & Desain Selaras Contoh Gambar 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Dokumen */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Total Dokumen</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {totalCount}
          </span>
        </div>

        {/* Receipt (Lunas) */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Receipt (Lunas)</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {paidCount}
          </span>
        </div>

        {/* Invoice (Menunggu) */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Invoice (Menunggu)</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {unpaidCount}
          </span>
        </div>

        {/* Invoice (Batal) */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Invoice (Batal)</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {cancelledCount}
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar (Filtering diletakkan pas di samping pencarian) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        {/* Kolom Pencarian */}
        <div className="w-full sm:w-72 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor invoice, paket, metode..."
            className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
        </div>

        {/* Filter Pills langsung di samping kolom pencarian */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === "all"
                ? "bg-[#2d1b11] text-white shadow-xs"
                : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
            }`}
          >
            Semua {totalCount}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("paid")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === "paid"
                ? "bg-[#2d1b11] text-white shadow-xs"
                : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
            }`}
          >
            Receipt / Lunas {paidCount}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("unpaid")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === "unpaid"
                ? "bg-[#2d1b11] text-white shadow-xs"
                : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
            }`}
          >
            Menunggu {unpaidCount}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("cancelled")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              filterStatus === "cancelled"
                ? "bg-[#2d1b11] text-white shadow-xs"
                : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
            }`}
          >
            Dibatalkan {cancelledCount}
          </button>
        </div>
      </div>

      {/* 4. The Invoice Table (Header Oranye Selaras Design Utama seperti Gambar 2) */}
      <div className="bg-white rounded-2xl border border-[#e5d8c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            {/* Header Oranye (#f5a638) sesuai tema utama di Gambar 2 */}
            <thead className="bg-[#f5a638] text-[#2d1b11]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Tipe Dokumen</th>
                <th className="py-3.5 px-4 font-semibold">Nomor Dokumen</th>
                <th className="py-3.5 px-4 font-semibold">Paket Kuota</th>
                <th className="py-3.5 px-4 font-semibold">Nominal</th>
                <th className="py-3.5 px-4 font-semibold">Metode Pembayaran</th>
                <th className="py-3.5 px-4 font-semibold">Tanggal</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <p className="font-medium text-xs">Tidak ada dokumen transaksi yang sesuai</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isReceipt = inv.docType === "receipt" || inv.status === "paid";
                  const isCancelled = inv.status === "cancelled";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      {/* Tipe Dokumen */}
                      <td className="py-3.5 px-4">
                        {isReceipt ? (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                            Receipt
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600">
                            Invoice
                          </span>
                        )}
                      </td>

                      {/* Nomor Dokumen */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                        {inv.id}
                      </td>

                      {/* Paket Kuota */}
                      <td className="py-3.5 px-4 font-medium text-zinc-800">
                        {inv.packageName}
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 font-bold text-zinc-900">
                        {inv.amount}
                      </td>

                      {/* Metode Pembayaran */}
                      <td className="py-3.5 px-4 text-zinc-600 font-normal">
                        {inv.paymentMethod}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-4 text-zinc-600 font-normal">
                        {inv.date}
                      </td>

                      {/* Status Pill Badge (Selaras dengan badge status Gambar 2) */}
                      <td className="py-3.5 px-4">
                        {isReceipt ? (
                          <span className="inline-block bg-[#eaf7f0] text-emerald-700 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200/60">
                            Lunas
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-block bg-zinc-100 text-zinc-600 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-zinc-200">
                            Batal
                          </span>
                        ) : (
                          <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200/60">
                            Menunggu
                          </span>
                        )}
                      </td>

                      {/* Aksi Button (Selaras dengan tombol Buka di Gambar 2) */}
                      <td className="py-3.5 px-4 text-center">
                        <Link href={`/invoice/${inv.id}`}>
                          <button
                            type="button"
                            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
