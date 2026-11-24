"use client";

import React, { useState } from "react";

interface AdminPartnerItem {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  packageTier: "Basic" | "Pro" | "Premium";
  quotaUsed: number;
  quotaTotal: number;
  status: "active" | "inactive";
  joinedDate: string;
}

const INITIAL_PARTNERS: AdminPartnerItem[] = [
  {
    id: "PTR-001",
    name: "Artha Wijaya",
    businessName: "Studio Kumtura",
    email: "billing@kumtura.com",
    phone: "0812-3456-7890",
    packageTier: "Premium",
    quotaUsed: 14,
    quotaTotal: 50,
    status: "active",
    joinedDate: "10 Okt 2026",
  },
  {
    id: "PTR-002",
    name: "Wayan Darma",
    businessName: "Bali Moments",
    email: "finance@balimoments.id",
    phone: "0819-8765-4321",
    packageTier: "Pro",
    quotaUsed: 3,
    quotaTotal: 30,
    status: "active",
    joinedDate: "15 Sep 2026",
  },
  {
    id: "PTR-003",
    name: "Kirana Dewi",
    businessName: "Kirana Event Organizer",
    email: "contact@kiranaevent.com",
    phone: "0857-1122-3344",
    packageTier: "Basic",
    quotaUsed: 1,
    quotaTotal: 10,
    status: "active",
    joinedDate: "01 Agu 2026",
  },
  {
    id: "PTR-004",
    name: "Budi Santoso",
    businessName: "Undiksha Team",
    email: "partner@undiksha.ac.id",
    phone: "0813-9988-7766",
    packageTier: "Pro",
    quotaUsed: 3,
    quotaTotal: 30,
    status: "active",
    joinedDate: "02 Jan 2026",
  },
];

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartnerItem[]>(INITIAL_PARTNERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPartner, setSelectedPartner] = useState<AdminPartnerItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = partners.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.packageTier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleStatus = (id: string) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = p.status === "active" ? "inactive" : "active";
          setToastMessage(`Status mitra ${p.businessName} berhasil diubah ke: ${next.toUpperCase()}`);
          return { ...p, status: next };
        }
        return p;
      })
    );
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

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Partner Management
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Kelola kemitraan vendor WO, EO, studio foto, kuota aktif, dan status operasional
        </p>
      </div>

      {/* Search Bar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari partner atau bisnis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e5d8c8] text-xs px-4 py-2.5 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`text-xs px-4 py-2 rounded-full font-semibold transition cursor-pointer ${
              filter === "all"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Semua ({partners.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition cursor-pointer ${
              filter === "active"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setFilter("inactive")}
            className={`text-xs px-4 py-2 rounded-full font-medium transition cursor-pointer ${
              filter === "inactive"
                ? "bg-[#1c1c1c] text-white shadow-xs"
                : "bg-white text-zinc-700 border border-[#e5d8c8] hover:bg-zinc-50"
            }`}
          >
            Inaktif
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">ID Partner</th>
                <th className="py-3 px-4 font-bold">Nama Vendor & PIC</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">No. Telepon</th>
                <th className="py-3 px-4 font-bold">Paket Tier</th>
                <th className="py-3 px-4 font-bold">Kuota Terpakai</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                    {p.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-zinc-900">{p.businessName}</p>
                    <p className="text-[11px] text-zinc-500">PIC: {p.name}</p>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-medium">
                    {p.email}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-normal">
                    {p.phone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-[#fffdf7] text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                      {p.packageTier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-800">
                    {p.quotaUsed} / {p.quotaTotal}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.status === "active" ? (
                      <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-block bg-zinc-100 text-zinc-600 font-semibold px-3 py-0.5 rounded-full text-[11px]">
                        Inaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPartner(p)}
                        className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p.id)}
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition cursor-pointer ${
                          p.status === "active"
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {p.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e5d8c8] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#f5a638] px-6 py-4 flex items-center justify-between text-[#2d1b11]">
              <h3 className="font-black text-base">Profil Mitra: {selectedPartner.businessName}</h3>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-[#2d1b11] hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500 font-medium">PIC:</span>
                <span className="font-bold text-zinc-900">{selectedPartner.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500 font-medium">Email:</span>
                <span className="font-semibold text-zinc-800">{selectedPartner.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500 font-medium">Telepon:</span>
                <span className="font-semibold text-zinc-800">{selectedPartner.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500 font-medium">Paket Aktif:</span>
                <span className="font-bold text-amber-700">{selectedPartner.packageTier}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500 font-medium">Kuota Terpakai:</span>
                <span className="font-bold text-zinc-900">{selectedPartner.quotaUsed} / {selectedPartner.quotaTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Tanggal Bergabung:</span>
                <span className="text-zinc-700 font-medium">{selectedPartner.joinedDate}</span>
              </div>
            </div>
            <div className="bg-zinc-50 px-6 py-3.5 flex justify-end border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="bg-[#24140b] text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-black transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
