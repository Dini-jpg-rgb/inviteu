"use client";

import React, { useState } from "react";

interface AdminTemplateItem {
  id: string;
  name: string;
  designer: string;
  submittedAt: string;
  category: string;
  status: "Pending Review" | "Published" | "Rejected";
  description: string;
}

const INITIAL_TEMPLATES: AdminTemplateItem[] = [
  {
    id: "tpl-01",
    name: "Floral Pink",
    designer: "Jack",
    submittedAt: "Kemarin",
    category: "Wedding Floral",
    status: "Pending Review",
    description: "Tema pernikahan romantis bernuansa bunga sakura lembut dengan ornamen floral modern.",
  },
  {
    id: "tpl-02",
    name: "Classic Cream",
    designer: "Jack",
    submittedAt: "2 hari lalu",
    category: "Traditional & Elegant",
    status: "Pending Review",
    description: "Desain minimalis beraksen warna krem keemasan cocok untuk pernikahan intimate & formal.",
  },
  {
    id: "tpl-03",
    name: "Modern Minimalist",
    designer: "Dwi",
    submittedAt: "1 minggu lalu",
    category: "Minimalist Modern",
    status: "Published",
    description: "Tata letak tipografi bersih dengan navigasi intuitif dan palet warna monokrom.",
  },
  {
    id: "tpl-04",
    name: "Golden Luxury Rose",
    designer: "Siti Rahma",
    submittedAt: "2 minggu lalu",
    category: "Luxury Royal",
    status: "Rejected",
    description: "Desain ornamen emas berkilau. Perlu perbaikan kontras teks pada layar perangkat kecil.",
  },
];

export default function AdminTemplateManagementPage() {
  const [templates, setTemplates] = useState<AdminTemplateItem[]>(INITIAL_TEMPLATES);
  const [filter, setFilter] = useState<"Pending" | "Semua" | "Published" | "Rejected">("Pending");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<AdminTemplateItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingCount = templates.filter((t) => t.status === "Pending Review").length;

  const filteredTemplates = templates.filter((item) => {
    // Filter status
    if (filter === "Pending" && item.status !== "Pending Review") return false;
    if (filter === "Published" && item.status !== "Published") return false;
    if (filter === "Rejected" && item.status !== "Rejected") return false;

    // Filter search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.designer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApprove = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Published" } : t))
    );
    const item = templates.find((t) => t.id === id);
    setToastMessage(`Template "${item?.name}" berhasil di-Publish dan aktif di katalog Partner!`);
    setSelectedTemplate(null);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      alert("Harap masukkan catatan/alasan penolakan untuk desainer!");
      return;
    }
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Rejected" } : t))
    );
    const item = templates.find((t) => t.id === id);
    setToastMessage(`Template "${item?.name}" ditolak dengan catatan: "${rejectReason}"`);
    setRejectReason("");
    setSelectedTemplate(null);
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

      {/* Header (Matching Image 2) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Template Management
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Review dan approval template dari Designer
        </p>
      </div>

      {/* Search Bar & Filter Pills (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari template"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e5d8c8] text-xs px-4 py-2.5 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pending Review 2 */}
          <button
            type="button"
            onClick={() => setFilter("Pending")}
            className={`text-xs px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
              filter === "Pending"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Pending Review {pendingCount}
          </button>

          {/* Semua */}
          <button
            type="button"
            onClick={() => setFilter("Semua")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Semua"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Semua
          </button>

          {/* Published */}
          <button
            type="button"
            onClick={() => setFilter("Published")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Published"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Published
          </button>

          {/* Rejected */}
          <button
            type="button"
            onClick={() => setFilter("Rejected")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
              filter === "Rejected"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Templates Table (Amber Header #f5a638 - Matching Image 2) */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">Template</th>
                <th className="py-3 px-4 font-bold">Designer</th>
                <th className="py-3 px-4 font-bold">Disubmit</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <p className="font-semibold text-xs">Tidak ada template pada kategori ini</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Coba ganti kata kunci pencarian atau ubah tab filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 font-medium">
                      {t.designer}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-normal">
                      {t.submittedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.status === "Pending Review" ? (
                        <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                          Pending Review
                        </span>
                      ) : t.status === "Published" ? (
                        <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200">
                          Published
                        </span>
                      ) : (
                        <span className="inline-block bg-red-50 text-red-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-red-200">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t);
                          setRejectReason("");
                        }}
                        className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Review Template Detail */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e5d8c8] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#f5a638] px-6 py-4 flex items-center justify-between text-[#2d1b11]">
              <div>
                <h3 className="font-black text-base">Review Template Undangan</h3>
                <p className="text-xs text-[#543015] font-medium mt-0.5">
                  ID: {selectedTemplate.id} • Kategori: {selectedTemplate.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-[#2d1b11] hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-500 font-medium">Nama Template:</span>
                  <p className="font-bold text-zinc-900 mt-0.5 text-sm">{selectedTemplate.name}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Desainer Pengaju:</span>
                  <p className="font-bold text-zinc-900 mt-0.5 text-sm">{selectedTemplate.designer}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Waktu Submit:</span>
                  <p className="font-semibold text-zinc-800 mt-0.5">{selectedTemplate.submittedAt}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Status Saat Ini:</span>
                  <p className="font-semibold text-amber-700 mt-0.5">{selectedTemplate.status}</p>
                </div>
              </div>

              <div>
                <span className="text-zinc-600 font-medium">Deskripsi Tema:</span>
                <p className="text-zinc-800 bg-white p-3 rounded-lg border border-zinc-200 mt-1 leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">
                  Catatan Reviewer / Feedback (Diisi jika ingin menolak):
                </label>
                <textarea
                  rows={2}
                  placeholder="Berikan alasan spesifik jika ditolak, misal: perbaiki kontras warna, schema JSON belum valid..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#f5a638]"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleReject(selectedTemplate.id)}
                className="bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Tolak Template
              </button>

              <button
                type="button"
                onClick={() => handleApprove(selectedTemplate.id)}
                className="bg-[#f5a638] hover:bg-[#e09228] text-[#2d1b11] font-extrabold px-5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                ✓ Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
