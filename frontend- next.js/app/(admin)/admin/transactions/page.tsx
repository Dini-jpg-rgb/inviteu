"use client";

import React, { useState } from "react";

interface AdminTransactionItem {
  id: string; // "ORD-0001"
  docNumber: string; // "INV-2026-11-001" or "REC-2026-11-002"
  docType: "invoice" | "receipt";
  partner: string;
  partnerEmail: string;
  packageTier: "Basic" | "Pro" | "Premium";
  packageName: string;
  quotaText: string;
  total: string;
  numericTotal: number;
  status: "Menunggu" | "Lunas" | "Batal";
  date: string;
  paymentMethod: string;
  paidAt?: string;
  cancelledAt?: string;
  notes?: string;
}

const INITIAL_TRANSACTIONS: AdminTransactionItem[] = [
  {
    id: "ORD-0001",
    docNumber: "INV-2026-11-001",
    docType: "invoice",
    partner: "Studio Kumtura",
    partnerEmail: "billing@kumtura.com",
    packageTier: "Premium",
    packageName: "Package Premium - 500 Kuota Undangan",
    quotaText: "500 Kuota Undangan",
    total: "Rp 750.000",
    numericTotal: 750000,
    status: "Menunggu",
    date: "10 Nov 2026",
    paymentMethod: "Simulasi Pembayaran B2B (Transfer Bank)",
    notes: "Menunggu transfer dari pihak mitra partner.",
  },
  {
    id: "ORD-0002",
    docNumber: "REC-2026-11-002",
    docType: "receipt",
    partner: "Bali Moments",
    partnerEmail: "finance@balimoments.id",
    packageTier: "Pro",
    packageName: "Package Pro - 250 Kuota Undangan",
    quotaText: "250 Kuota Undangan",
    total: "Rp 350.000",
    numericTotal: 350000,
    status: "Lunas",
    date: "08 Nov 2026",
    paymentMethod: "BCA Virtual Account",
    paidAt: "08 Nov 2026, 11:42",
    notes: "Pembayaran terverifikasi otomatis.",
  },
  {
    id: "ORD-0003",
    docNumber: "INV-2026-11-003",
    docType: "invoice",
    partner: "Kirana Event",
    partnerEmail: "contact@kiranaevent.com",
    packageTier: "Basic",
    packageName: "Package Basic - 100 Kuota Undangan",
    quotaText: "100 Kuota Undangan",
    total: "Rp 150.000",
    numericTotal: 150000,
    status: "Batal",
    date: "05 Nov 2026",
    paymentMethod: "QRIS / GoPay",
    cancelledAt: "05 Nov 2026, 17:30",
    notes: "Dibatalkan oleh partner saat halaman konfirmasi checkout.",
  },
  {
    id: "ORD-0004",
    docNumber: "REC-2026-10-041",
    docType: "receipt",
    partner: "Undiksha Team",
    partnerEmail: "partner@undiksha.ac.id",
    packageTier: "Pro",
    packageName: "Package Pro - 250 Kuota Undangan",
    quotaText: "250 Kuota Undangan",
    total: "Rp 350.000",
    numericTotal: 350000,
    status: "Lunas",
    date: "02 Jan 2026",
    paymentMethod: "Simulasi Pembayaran B2B",
    paidAt: "02 Jan 2026, 14:20",
    notes: "Langganan paket Pro aktif.",
  },
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>(INITIAL_TRANSACTIONS);
  const [filter, setFilter] = useState<"Semua" | "Menunggu" | "Lunas" | "Batal">("Semua");
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<AdminTransactionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    if (filter !== "Semua" && t.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.partner.toLowerCase().includes(q) ||
        t.packageTier.toLowerCase().includes(q) ||
        t.docNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleMarkAsPaid = (orderId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === orderId) {
          const newDocNumber = t.docNumber.replace("INV-", "REC-");
          return {
            ...t,
            docNumber: newDocNumber,
            docType: "receipt",
            status: "Lunas",
            paidAt: new Date().toLocaleString("id-ID"),
            notes: "Dikonfirmasi lunas secara manual oleh Admin.",
          };
        }
        return t;
      })
    );
    const updated = transactions.find((t) => t.id === orderId);
    if (updated) {
      setSelectedTx({
        ...updated,
        docNumber: updated.docNumber.replace("INV-", "REC-"),
        docType: "receipt",
        status: "Lunas",
        paidAt: new Date().toLocaleString("id-ID"),
      });
    }
    setToastMessage(`Transaksi ${orderId} berhasil diubah menjadi Lunas dan diterbitkan Receipt resmi.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header (Matching Image 3) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Transaction / Payment
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Pembelian package dan status pembayaran
        </p>
      </div>

      {/* Search Bar & Filter Pills (Matching Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari order atau partner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e5d8c8] text-xs px-4 py-2.5 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Semua */}
          <button
            type="button"
            onClick={() => setFilter("Semua")}
            className={`text-xs px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
              filter === "Semua"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Semua
          </button>

          {/* Menunggu */}
          <button
            type="button"
            onClick={() => setFilter("Menunggu")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Menunggu"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Menunggu
          </button>

          {/* Lunas */}
          <button
            type="button"
            onClick={() => setFilter("Lunas")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Lunas"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Lunas
          </button>

          {/* Batal */}
          <button
            type="button"
            onClick={() => setFilter("Batal")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Batal"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Batal
          </button>
        </div>
      </div>

      {/* Transactions Table (Orange Header #f5a638 - Matching Image 3) */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">Order</th>
                <th className="py-3 px-4 font-bold">Partner</th>
                <th className="py-3 px-4 font-bold">Package</th>
                <th className="py-3 px-4 font-bold">Total</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Tanggal</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <p className="font-semibold text-xs">Tidak ada riwayat transaksi ditemukan</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau ubah filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                      {trx.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      {trx.partner}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 font-medium">
                      {trx.packageTier}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      {trx.total}
                    </td>
                    <td className="py-3.5 px-4">
                      {trx.status === "Lunas" ? (
                        <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200">
                          Lunas
                        </span>
                      ) : trx.status === "Menunggu" ? (
                        <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                          Menunggu
                        </span>
                      ) : (
                        <span className="inline-block bg-red-50 text-red-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-red-200">
                          Batal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-normal">
                      {trx.date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(trx)}
                        className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
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

      {/* Detail Modal: Aligned with Invoice / Receipt concept */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#e5d8c8] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between text-white ${
                selectedTx.status === "Lunas"
                  ? "bg-emerald-800"
                  : selectedTx.status === "Batal"
                  ? "bg-zinc-800"
                  : "bg-[#24140b]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/20">
                    {selectedTx.status === "Lunas"
                      ? "BUKTI BAYAR (RECEIPT)"
                      : selectedTx.status === "Batal"
                      ? "INVOICE DIBATALKAN"
                      : "TAGIHAN (INVOICE)"}
                  </span>
                  <span className="font-mono text-xs opacity-90">{selectedTx.docNumber}</span>
                </div>
                <h3 className="text-base font-black tracking-tight mt-1">
                  Detail Transaksi #{selectedTx.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Proportional Card View */}
            <div className="p-6 space-y-5 text-xs">
              {/* Partner Information */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-500 font-medium">Mitra Partner:</span>
                  <p className="font-extrabold text-zinc-900 text-sm mt-0.5">{selectedTx.partner}</p>
                  <p className="text-zinc-500 text-[11px]">{selectedTx.partnerEmail}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Waktu Transaksi:</span>
                  <p className="font-bold text-zinc-800 mt-0.5">{selectedTx.date}</p>
                  <p className="text-zinc-500 text-[11px]">Metode: {selectedTx.paymentMethod}</p>
                </div>
              </div>

              {/* Package Detail Box (Yellow Border Box matching Checkout) */}
              <div className="bg-[#fffdf7] border border-[#f5a638] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-zinc-900">
                    Package {selectedTx.packageTier}
                  </h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {selectedTx.quotaText} • Widget {selectedTx.packageTier} • Design {selectedTx.packageTier}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-medium block">Nominal Paket</span>
                  <span className="font-black text-base text-zinc-900">{selectedTx.total}</span>
                </div>
              </div>

              {/* Status & Audit Trail */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-medium block">Status Dokumen:</span>
                  <div className="mt-1">
                    {selectedTx.status === "Lunas" ? (
                      <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200">
                        ✓ Lunas (Receipt Terverifikasi)
                      </span>
                    ) : selectedTx.status === "Menunggu" ? (
                      <span className="inline-block bg-[#fef5e7] text-amber-800 font-bold px-3 py-1 rounded-full text-xs border border-amber-200">
                        ⏳ Menunggu Pembayaran
                      </span>
                    ) : (
                      <span className="inline-block bg-red-50 text-red-800 font-bold px-3 py-1 rounded-full text-xs border border-red-200">
                        ✕ Batal (Tidak Diproses)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-medium block">Total Tagihan Bersih:</span>
                  <span className="font-black text-zinc-900 text-lg mt-0.5 block">
                    {selectedTx.total}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedTx.notes && (
                <div className="text-[11px] text-zinc-600 bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
                  <strong>Catatan Sistem:</strong> {selectedTx.notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️ Cetak / Simpan PDF</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedTx.status === "Menunggu" && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsPaid(selectedTx.id)}
                    className="bg-[#f5a638] hover:bg-[#e09228] text-[#2d1b11] font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    Konfirmasi Lunas (Terbitkan Receipt)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="bg-[#24140b] hover:bg-black text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
