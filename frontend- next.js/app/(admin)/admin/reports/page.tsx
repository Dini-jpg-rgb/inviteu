"use client";

import React from "react";

export default function AdminReportsPage() {
  const reportsList = [
    {
      title: "1. Partner Growth & Retention Report",
      desc: "Laporan pertumbuhan mitra vendor B2B, konversi registrasi, serta status aktivitas kemitraan.",
      metrics: "24 Total Partner (92% Aktif)",
      tag: "Partner B2B",
    },
    {
      title: "2. Invitation Lifecycle Report",
      desc: "Statistik undangan yang dibuat mitra, perbandingan rasio Draft, Published, dan Expired.",
      metrics: "318 Published, 42 Draft, 12 Expired",
      tag: "Undangan",
    },
    {
      title: "3. Transaction & Revenue Report",
      desc: "Rekapitulasi transaksi pembelian kuota paket, status invoice, penerbitan receipt, dan total omset.",
      metrics: "Rp 48.500.000 (Bulan Berjalan)",
      tag: "Finansial",
    },
    {
      title: "4. Usage & Quota Utilization Report",
      desc: "Utilisasi kuota paket aktif oleh mitra, frekuensi pemakaian widget, dan statistik penyimpanan.",
      metrics: "76% Kuota Terpakai Efektif",
      tag: "Kapasitas",
    },
    {
      title: "5. RSVP & Guest Attendance Report",
      desc: "Rasio kehadiran tamu undangan, jumlah konfirmasi Hadir vs Tidak Hadir di seluruh platform.",
      metrics: "88% Rata-rata Konfirmasi Hadir",
      tag: "Tamu RSVP",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Reports
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Laporan operasional menyeluruh platform InviteU (5 Jenis Laporan)
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-[#24140b] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <span>📥 Unduh Laporan (PDF / Cetak)</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportsList.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-[#e5d8c8] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400e] bg-[#fef3c7] px-2.5 py-0.5 rounded-full border border-amber-200">
                  {r.tag}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">#0{i + 1}</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 mt-1 leading-snug">
                {r.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {r.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#b45309]">
                {r.metrics}
              </span>
              <button
                type="button"
                onClick={() => alert(`Mengunduh berkas laporan: ${r.title}`)}
                className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
              >
                Unduh
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
