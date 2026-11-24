"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePartner } from "@/context/PartnerContext";

export default function InvitationsPage() {
  const { invitations, activePackage } = usePartner();
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Perhitungan kuota & metrics
  const totalCount = invitations.length;
  const draftCount = invitations.filter((i) => i.status === "Draft").length;
  const publishedCount = invitations.filter((i) => i.status === "Published").length;
  const expiredCount = invitations.filter((i) => i.status === "Expired").length;

  const maxQuota =
    activePackage === "basic"
      ? 5
      : activePackage === "medium"
      ? 20
      : 10; // Default Paket Pro: 10 kuota sesuai gambar referensi

  const usedQuota = publishedCount;
  const remainingQuota = Math.max(0, maxQuota - usedQuota);

  // Filter data sesuai status & pencarian
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      // Filter status
      if (filter === "draft" && inv.status !== "Draft") return false;
      if (filter === "published" && inv.status !== "Published") return false;
      if (filter === "expired" && inv.status !== "Expired") return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inv.title.toLowerCase().includes(q);
        const matchTemplate = (inv.template || "").toLowerCase().includes(q);
        const matchDate = inv.eventDate.toLowerCase().includes(q);
        if (!matchTitle && !matchTemplate && !matchDate) return false;
      }

      return true;
    });
  }, [invitations, filter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* 1. Page Header (My Invitations + Create Invitation Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            My Invitations
          </h1>
          <p className="text-xs text-zinc-500 font-normal mt-1">
            Ringkasan invitation milikmu
          </p>
        </div>

        <Link href="/templates">
          <button
            type="button"
            className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Create Invitation</span>
          </button>
        </Link>
      </div>

      {/* 2. Top Metric Cards (4 Kotak Oranye - Persis seperti di gambar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invitation */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Total invitation</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {totalCount}
          </span>
        </div>

        {/* Draft */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Draft</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {draftCount}
          </span>
        </div>

        {/* Published */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Published</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {publishedCount}
          </span>
        </div>

        {/* Expired */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2d1b11]">Expired</span>
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
            {expiredCount}
          </span>
        </div>
      </div>

      {/* 3. Quota Invitation Card (Persis seperti di gambar) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8]/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-semibold text-zinc-900">Quota invitation</span>
          <span className="font-bold text-zinc-900">
            {usedQuota} / {maxQuota}
          </span>
        </div>

        {/* Progress bar: Sisa kuota (load masih panjang jika baru terpakai sedikit) */}
        <div className="w-full h-2 rounded-full bg-[#f0e6d8] overflow-hidden">
          <div
            className="h-full bg-[#f5a638] rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, (remainingQuota / maxQuota) * 100))}%`,
            }}
          />
        </div>

        <p className="text-[11px] sm:text-xs text-zinc-500 font-normal">
          Draft tidak memakai quota. Quota berkurang 1 saat publish pertama.
        </p>
      </div>

      {/* 4. Section Title & Search/Filter Controls */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-zinc-900">
            Invitation Terbaru
          </h2>
          <p className="text-xs text-zinc-500 font-normal mt-0.5">
            Semua invitation milik kamu
          </p>
        </div>

        {/* Search input & Filter pills (Filtering diletakkan pas di samping pencarian) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search box */}
          <div className="w-full sm:w-64 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari invitation"
              className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
          </div>

          {/* Filter Pills langsung di samping search box */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === "all"
                  ? "bg-[#2d1b11] text-white shadow-xs"
                  : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
              }`}
            >
              Semua {totalCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter("draft")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === "draft"
                  ? "bg-[#2d1b11] text-white shadow-xs"
                  : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
              }`}
            >
              Draft {draftCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter("published")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === "published"
                  ? "bg-[#2d1b11] text-white shadow-xs"
                  : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
              }`}
            >
              Published {publishedCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter("expired")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === "expired"
                  ? "bg-[#2d1b11] text-white shadow-xs"
                  : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
              }`}
            >
              Expired {expiredCount}
            </button>
          </div>
        </div>
      </div>

      {/* 5. The Invitations Table (Header Oranye & Foto Cover Sesuai Posisi Icon Foto) */}
      <div className="bg-white rounded-2xl border border-[#e5d8c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            {/* Table Header: Oranye (#f5a638) sesuai gambar referensi */}
            <thead className="bg-[#f5a638] text-[#2d1b11]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Invitation</th>
                <th className="py-3.5 px-4 font-semibold">Template</th>
                <th className="py-3.5 px-4 font-semibold">Tanggal event</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Expiration</th>
                <th className="py-3.5 px-4 font-semibold">RSVP</th>
                <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <p className="font-medium text-xs">Tidak ada data undangan yang sesuai</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Klik tombol &quot;+ Create Invitation&quot; di atas untuk membuat undangan baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Invitation: Foto Cover diletakkan tepat di posisi icon foto */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-100 shadow-2xs">
                          <Image
                            src={inv.cover || "/templates/wedding/couple-main.jpg"}
                            alt={inv.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <span className="font-semibold text-xs sm:text-sm text-zinc-900">
                          {inv.title}
                        </span>
                      </div>
                    </td>

                    {/* Template */}
                    <td className="py-3.5 px-4 text-zinc-700">
                      {inv.template || "Botanical Sage"}
                    </td>

                    {/* Tanggal Event */}
                    <td className="py-3.5 px-4 text-zinc-700">
                      {inv.eventDate}
                    </td>

                    {/* Status Pill Badge */}
                    <td className="py-3.5 px-4">
                      {inv.status === "Published" ? (
                        <span className="inline-block bg-[#eaf7f0] text-emerald-700 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200/60">
                          Published
                        </span>
                      ) : inv.status === "Draft" ? (
                        <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200/60">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-block bg-zinc-100 text-zinc-600 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-zinc-200">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Expiration */}
                    <td className="py-3.5 px-4 text-zinc-600">
                      {inv.status === "Draft" ? "-" : inv.expiration || "28 Jun 2027"}
                    </td>

                    {/* RSVP */}
                    <td className="py-3.5 px-4 text-zinc-800 font-medium">
                      {inv.status === "Draft" ? "-" : `${inv.rsvpCount} hadir`}
                    </td>

                    {/* Aksi Button: Buka */}
                    <td className="py-3.5 px-4 text-center">
                      <Link href={`/invitations/${inv.id}`}>
                        <button
                          type="button"
                          className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Buka
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
